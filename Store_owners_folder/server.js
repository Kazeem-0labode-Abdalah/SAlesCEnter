const express = require("express")
const multer = require("multer")
const mySQL = require("mysql2/promise");
const app = express()
const ftp = require("ftp")
const path = require("path")
const ejs = require("ejs")
const body_parser = require("body-parser");
const upload = multer({
    dest:"./Product_images/"
})
app.use(body_parser.urlencoded({
    extended:true
}))
app.use(body_parser.json())
app.set("view engine","ejs")
app.use(express.static("public"))   
app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"index_for_repliers.html"))

})

let Store_owner_first_name = ""
let Store_owner_last_name = ""
let Store_owner_email = ""
let Store_owner_phone_number = ""
let Store_owner_full_name = ""
let  Store_id = ""
let Store_name = ""

app.post("/sign_up",(req,res)=>{
       
   async function sign_up() {
    
    try {
        const db = await mySQL.createConnection({
            host:"localhost",
            user:"root",
            password:"olabode2112",
            database:"users_database"
        })
        
        let values_for_phase1 = [req.body.email,req.body.password]
        let values = [req.body.store_name,req.body.first_name,req.body.last_name,req.body.email,req.body.password,req.body.phone_number]
        let phase1 =  await db.execute("select * from Store_owner_table where Store_owner_email = ? and Store_owner_password = ?",values_for_phase1)
       
        if(phase1[0].length > 0){
            res.send("This user already exixt")
    }else{
        const result = await db.execute("INSERT INTO Store_owner_table(Store_name,Store_owner_first_name,Store_owner_last_name,Store_owner_email,Store_owner_password,Store_owner_phone_number) VALUES(?,?,?,?,?,?)",values);
        res.sendFile(path.join(__dirname,"login.html"))
    }
        
 } catch (err) {
        console.log(err)
    }

   }

   sign_up();
})


app.post("/login",(req,res)=>{
     async function login() {
    
        try {
            const db = await mySQL.createConnection({
                host:"localhost",
                user:"root",
                password:"olabode2112",
                database:"users_database"
            })   
            let values = [req.body.email,req.body.password]
            const result = await db.execute("SELECT * FROM Store_owner_table WHERE Store_owner_email = ? and Store_owner_password = ?",values);


            if(result[0].length > 0){
                Store_id = result[0][0].Store_owner_id
                Store_name =  result[0][0].Store_name
                Store_owner_first_name =  result[0][0].Store_owner_first_name
                Store_owner_last_name = result[0][0].Store_owner_last_name
                Store_owner_email = result[0][0].Store_owner_email
                Store_owner_phone_number = result[0][0].Store_owner_phone_number
                Store_owner_full_name = Store_owner_last_name + " " + Store_owner_first_name
                Store_name = result[0][0].Store_name
        
                res.render("upload_product",{Store_owner_information:{Store_id,Store_name,Store_owner_full_name,Store_owner_first_name,Store_owner_last_name,Store_owner_email,Store_owner_phone_number}});
            }else{
                res.send("This user does not exist")
            }
            
     } catch (err) {
            console.log(err)
        }
    
       }
    
       login();
})

app.post("/Already_have_an_account",(req,res)=>{
    res.sendFile(path.join(__dirname,"login.html"))

})


app.post("/upload_new_product_to_database",upload.single("Product_image"),(req,res)=>{
    let Product_name = req.body.Product_name
    let Product_price = req.body.Product_price
    let Product_image = req.file
    let Store_owner_id = req.body.Store_owner_id;
    
    async function upload_product_information_to_database(){
        try {
            const db = await mySQL.createConnection({
                host:"localhost",
                user:"root",
                password:"olabode2112",
                database:"users_database"
            })
        const [Opration_one] = await db.execute("insert into products_table(Product_name, Product_price,Store_owner_id,Store_name) values (?,?,?,?)",[Product_name,Product_price,Store_owner_id,Store_name])    
        const [Opration_two] = await db.execute("select MAX(Product_id) AS max_id from  products_table")

        const client = new ftp();
        client.connect({
            host: "209.159.156.150",
            user:"kreativesv_kreativestackvault.com",
            password:"Olabode2112Ob@"
        })

        client.on("ready",()=>{
            client.put(req.file.path,String(Opration_two[0].max_id),(err)=>{
                if(err){
                    console.log(err)
                }else{
                    console.log("no error uploading to ftp")
                }
            })
        })

     
        } catch (error) {
            console.log("")
        }
    }
    upload_product_information_to_database(); 
    res.send("Product information has been uploaded to the database")
})


app.get("/Upload_Products",(req,res)=>{
    if(Store_name.length === 0){
        res.send("Login to upload products")
    }else{
    res.render("upload_product",{Store_owner_information:{Store_id,Store_name,Store_owner_full_name,Store_owner_first_name,Store_owner_last_name,Store_owner_email,Store_owner_phone_number}});
    }
})


app.get("/Update_Products_information",(req,res)=>{
    if(Store_name.length === 0){
        res.send("Login to update your products information")
    }else{
    let array_to_hold_product_info = new Array()
    async function retrieve_product_information_for_update_product_information_ejs(){
        try {
            const db = await mySQL.createConnection({
                host:"localhost",
                user:"root",
                password:"olabode2112",
                database:"users_database"

            })
           
            let [opration_one] = await db.execute("select * from products_table where Store_owner_id = ?",[Store_id]);
            for(let i = 0 ; i < opration_one.length; i++ ){
                array_to_hold_product_info.push(new Array(opration_one[i].Product_id,opration_one[i].Product_name,opration_one[i].Product_price))
            }
            res.render("update_product_information",{array_to_hold_product_info})
        }catch(err){
            console.log(err)
        }
    }
    retrieve_product_information_for_update_product_information_ejs();
}
})

app.post("/Update_Products_infomation2",(req,res)=>{

    let product_id = req.body.Product_id;
    let product_name = req.body.Product_new_name;
    let product_price = req.body.Product_new_price
  
    async function update_product_new_information_to_database(){
        try {
            const db = await mySQL.createConnection({
               
                host:"localhost",
                user:"root",
                password:"olabode2112",
                database:"users_database"

            })
          
            let [opration_one] = await db.execute("update products_table set Product_name = ?  where Product_id = ?",[product_name,product_id])
            let [opration_two] = await db.execute("update products_table set Product_price = ?  where Product_id = ?",[product_price,product_id])
           
        }catch(err){
            console.log(err)
        }

    }
    update_product_new_information_to_database();


})

app.get("/Placed_orders",(req,res)=>{
    let order_holder = new Array()
    if(Store_name.length === 0){
        res.send("Login to view placed orders")
    }else{

    async function retrieve_placed_orders_from_database() {
    
        try {
            const db = await mySQL.createConnection({
                host:"localhost",
                user:"root",
                password:"olabode2112",
                database:"users_database"
            })
            let  values = Store_id;
            const result = await db.execute("select * from Orders_table where date(Date_order_was_uploaded_to_the_database) = curdate() and Store_owner_id = ?",[values]);
            for(let i =0; i < result[0].length; i++){
                order_holder.push(new Array(result[0][i].Order_id,result[0][i].Customer_name,result[0][i].Customer_email,result[0][i].Customer_tel_number,result[0][i].Customer_location,result[0][i].Product_amount,result[0][i].Product_name,result[0][i].Product_price))
            }

        } catch (err) {
            console.log(err)
        }
        res.render("Placed_orders",{order_holder})
       }
    
       retrieve_placed_orders_from_database();
    }
   
})

app.post("/Delete_product_from_store",(req,res)=>{
    async function Delete_product_from_store() {
    
        try {
            const db = await mySQL.createConnection({
                host:"localhost",
                user:"root",
                password:"olabode2112",
                database:"users_database"
            })
            let  values =req.body.Product_id ;
            const result = await db.execute("delete from products_table where product_id = ?",[values]);
        } catch (err) {
            console.log(err)
        }
       }

       Delete_product_from_store();
})

// app.post("/Delivered_order",(req,res)=>{
//     console.log(req.body.Order_id_number)
// })
//Below is for the index.ejs file


app.listen(3001)