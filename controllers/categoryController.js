const Category = require('../models/Category.model');

// category handler function
exports.createCategory = async (req, res) => {
  try {
    //fetch data
    const { name, description } = req.body;

    // validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // create entry in db
    const categoryDetails = await Category.create({
      name: name,
      description: description,
    });

    // return response
    return res.status(200).json({
      success: true,
      message: 'Category created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all category handler function

exports.showAllcategories = async (req, res) => {
  try {
    const allCategories = await Category.find({},{name:true,description:true});

    res.status(200).json({
      success: true,
      data: allCategories,
      message: 'All Categories fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
