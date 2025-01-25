const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); 
const wrapAsync = require("./utils/wrapasync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

main()
.then(res => console.log("connected to DB"))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
};

const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else {
        next();
    };
};

//index route
app.get("/listings", wrapAsync(async (req, res) => {
   const allListings = await Listing.find({});
   res.render("./listings/index.ejs", {allListings});
}));

//new route
app.get("/listings/new", (req, res) => {
    res.render("./listings/new.ejs");
});

//show route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("./listings/show.ejs", {listing});
}));

//create route
app.post("/listings",validateListing, wrapAsync(async(req, res) => {
    let newListing = new Listing (req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

//edit route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("./listings/edit.ejs", {listing});
}));

//update route
app.put("/listings/:id",validateListing, wrapAsync(async (req, res) => {
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id , {...req.body.listing});
    res.redirect(`/listings/${id}`);
}));

//delete route
app.delete("/listings/:id",validateListing, wrapAsync(async (req, res) => {
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));

app.all("*", (req, res, next) => {
    next(new ExpressError(404,"Page not found!"));
});

app.use((err, req, res, next) => {
    let {status = 500, message = "Something went wrong!" } = err;
    res.status(status).render("./listings/error.ejs", {message});
    // res.status(status).send(message);
})

app.get("/", (req,res) => {
    res.send("Response is okay");
}); 

app.listen(8080, () => {
    console.log("server is listening at port 8080");
})