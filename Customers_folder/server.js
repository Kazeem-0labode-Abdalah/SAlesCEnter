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

let  customer_name = " "
let customer_tel_number = " "
let customer_location = " "
let customer_email = " "

let customer_first_name = " "
let customer_last_name = " "
let customer_email2 = " "
let customer_phone_number = " "
let customer_full_name = " "


app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"sign_up.html"))

})

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
        let values = [req.body.first_name,req.body.last_name,req.body.email,req.body.password,req.body.phone_number]
        let phase1 =  await db.execute("select * from Customers_table where Customer_email = ? and Customer_password = ?",values_for_phase1)

        if(phase1[0].length > 0){
            res.send("This user already exixt")
        }else{
            const result = await db.execute("INSERT INTO Customers_table(Customer_first_name,Customer_last_name,Customer_email,Customer_password,Customer_phone_number) VALUES(?,?,?,?,?)",values);
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
        let [opration_two] ="";
        let product_info_holder = new Array();
        let product_image_holder = new Array()
        let Store_name_and_Store_id_holder = new Array()
    
        try {
            const db = await mySQL.createConnection({
                host:"localhost",
                user:"root",
                password:"olabode2112",
                database:"users_database"
            })
            
            let values = [req.body.email,req.body.password]
            const result = await db.execute("SELECT * FROM Customers_table WHERE Customer_email = ? and Customer_password = ?",values);
           

            if(result[0].length > 0){
                customer_first_name =  result[0][0].Customer_first_name
                customer_last_name = result[0][0].Customer_last_name
                customer_email2 = result[0][0].Customer_email
                customer_phone_number = result[0][0].Customer_phone_number
                customer_full_name = customer_last_name + " " + customer_first_name

                
                let [opration_one] = await db.execute("select * from products_table")  
                for(let i = 0; i < opration_one.length; i++){
                    [opration_two] = await db.execute("SELECT * FROM products_table  ORDER BY RAND() LIMIT 1")
                    product_info_holder.push(new Array(opration_two[0].Product_name,opration_two[0].Product_price,opration_two[0].Store_owner_id,opration_two[0].Store_name))
                }
    
    
                for(let i = 1; i <= opration_two.length;i++){
                    let client = new ftp();
        
                    client.connect({
                        host: "209.159.156.150",
                        user:"kreativesv_kreativestackvault.com",
                        password:"Olabode2112Ob@"
                       
                    })
                
                
                    client.on("ready",()=>{
                        client.get(String(opration_two[i].Product_id),(err,stream)=>{
                            console.log(i)
                    if(err){
                        console.log(err)
                    }else{
                        const chunks = [];
                        stream.on("data",(chunk)=>
                        {
                            chunks.push(chunk)
                        })
                
                
                        stream.on("end",()=>{
                            const imageData = Buffer.concat(chunks)
                            const  imageBase64 = imageData.toString("base64")
                            product_image_holder.push(imageBase64)
                            console.log(product_image_holder)
                            
                        })
                    }
                })
          
            })
    
                            client.on("error",(err)=>{
                                console.log(err)
           })
                }

                let [opration_three] = await db.execute("select * from store_owner_table")

                for(let i = 0; i < opration_three.length; i++){
                    Store_name_and_Store_id_holder.push(new Array(opration_three[i].Store_owner_id,opration_three[i].Store_name))
                }
                
                res.render("index",{product_info_holder,product_image_holder,Store_name_and_Store_id_holder,customer_information :{customer_full_name,customer_first_name,customer_last_name,customer_email,customer_phone_number}});
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

app.post("/place_order",(req,res)=>{
    customer_name = req.body.customer_name
    customer_tel_number = req.body.customer_tel_number
    customer_location = req.body.customer_location
    customer_email = req.body.customer_email
    res.send("Your order has been placed")
   
})

app.post("/fourSquare",(req,res)=>{
    
   async function save_orders_to_database() {
    
    try {
        const db = await mySQL.createConnection({
            host:"localhost",
            user:"root",
            password:"olabode2112",
            database:"users_database"
        })
        if(customer_name.length > 0 && customer_location.length > 0 && customer_tel_number.length > 0){
        let values = [customer_name,customer_email,customer_tel_number,customer_location,req.body.fourSquareInfo.product_amount,req.body.fourSquareInfo.product_name,req.body.fourSquareInfo.product_price,req.body.fourSquareInfo.Store_owner_id]
        const result = await db.execute("INSERT INTO Orders_table(Customer_name,Customer_email,Customer_tel_number,Customer_location,Product_amount,Product_name,Product_price,Store_owner_id) VALUES(?,?,?,?,?,?,?,?)",values);
        }
 } catch (err) {
        console.log(err)
    }

   }

   save_orders_to_database();
})



app.post("/Store_Profile",(req,res)=>{
    const product_info_holder = new Array()
    const  product_image_holder = new Array()
    const Store_name_and_Store_id_holder = new Array()
    let Store_nameX;
    async function Store_link() {
    
        try {
            const db = await mySQL.createConnection({
                host:"localhost",
                user:"root",
                password:"olabode2112",
                database:"users_database"
            })
            const [opration_one] = await db.execute("select * from products_table where Store_name = ?",[req.body.Store_name]) 
                for(let i = 0; i < opration_one.length; i++){
                Store_nameX = opration_one[i].Store_name;
                 product_info_holder.push(new Array(opration_one[i].Product_name,opration_one[i].Product_price,opration_one[i].Store_owner_id,opration_one[i].Store_name))
            }
            
            for(let i = 1; i <= opration_one.length;i++){
                let client = new ftp();
    
                client.connect({
                    host: "209.159.156.150",
                    user:"kreativesv_kreativestackvault.com",
                    password:"Olabode2112Ob@"
                   
                })
            
            
                client.on("ready",()=>{
                    client.get(String(opration_one[i].Product_id),(err,stream)=>{
                if(err){
                    console.log(err)
                }else{
                    const chunks = [];
                    stream.on("data",(chunk)=>
                    {
                        chunks.push(chunk)
                    })
            
            
                    stream.on("end",()=>{
                        const imageData = Buffer.concat(chunks)
                        const  imageBase64 = imageData.toString("base64")
                        product_image_holder.push(imageBase64)
                        console.log(product_image_holder)
                        
                    })
                }
            })
      
        })

                        client.on("error",(err)=>{
                            console.log(err)
       })
            }

            let [opration_two] = await db.execute("select * from store_owner_table")
            for(let i = 0; i < opration_two.length; i++){
                Store_name_and_Store_id_holder.push(new Array(opration_two[i].Store_owner_id,opration_two[i].Store_name))
            }
     res.render("Store_profile",{Store_name:Store_nameX,product_info_holder,product_image_holder,Store_name_and_Store_id_holder,customer_information :{customer_full_name,customer_first_name,customer_last_name,customer_email,customer_phone_number}});
     
    } catch (err) {
            console.log(err)
        }
    
       }
    
       Store_link()
    })


app.listen(3000)