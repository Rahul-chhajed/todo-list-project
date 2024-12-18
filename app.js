const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');


mongoose.connect("mongodb://localhost:27017/todolistDB");
const app = express();
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "welcome to todolist"
});
const item2 = new Item({
    name: "click + to add new items"
});
const item3 = new Item({
    name: "<-- hit  to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema=new mongoose.Schema({
    name:String,
    items:[itemsSchema]
});

const List = mongoose.model("List",listSchema);


app.get("/", function (req, res) {
    Item.find({})
        .then(items => {
            if (items.length === 0) {
                
                Item.insertMany(defaultItems).then(function () {
                    console.log("added items to todolistdb successfully");
                }).catch(function (err) {
                    console.log(err);
                });
                res.redirect("/");
            }
            else {

                res.render("list", { weekday: "Today", itemlist: items });

            }
        })
        .catch(err => {
            console.log(err);
        });


})

app.get("/:topic",function(req,res){

    const listTopic=_.capitalize(req.params.topic);
   
    List.findOne({name:listTopic})
        .then(foundList => {
            if (!foundList) {
                const list=new List({
                    name:listTopic,
                    items:defaultItems
                });
               list.save();
               res.redirect("/"+listTopic);
            }
            else {
               console.log("already present");
               res.render("list", { weekday: foundList.name, itemlist:foundList.items});
            }
           
        })
        .catch(err => {
            console.log(err);
        });


});


app.post("/", function (request, response) {
    const itemName=request.body.item;
    const listName=request.body.listSubmit;

    const newitem=new Item({
        name:itemName
    });
   if(listName==="Today"){
    newitem.save();
    response.redirect("/");

   }
   else{
    List.findOne({name:listName})
    .then(foundList=>{
   if(foundList){
    foundList.items.push(newitem);
    foundList.save();
    response.redirect("/"+listName);
   }
   else{
    console.log("list not found to add items");
   }
    })
    .catch(err=>{
        console.log(err);
    });

   }

});

app.post("/delete",function(req,res){
    const itemId=req.body.checkbox;
    const listName=req.body.listName;
    if(listName==="Today"){
    Item.findByIdAndDelete({_id:itemId})
    .then(result=>{
        if(result.deletedCount==0){
            console.log("no id matched");
        }
        else{
        console.log("successfully deleted");
        }
    })
    .catch(err=>{
        console.log(err);
    });
    res.redirect("/");
}
else{
    List.findOneAndUpdate({name:listName},{$pull :{items:{_id:itemId}}})
    .then(foundList=>{
        console.log("Updated List:", foundList); 
        console.log(listName);
        res.redirect("/"+listName);
    })
    .catch(err=>{
        console.log(err);
    });
}
})
app.listen(3000, function () {
    console.log("port working on 3000");
});