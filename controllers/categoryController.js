const Category = require('../models/Category.model');
const Course = require('../models/Course.model');

// category handler function
exports.createCategory = async (req, res) => {
  //debug
  console.log('User is Admin', req.user.accountType === 'Admin');

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
    const allCategories = await Category.find(
      {},
      { name: true, description: true }
    );

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

// category page details
exports.categoryPageDetails = async (req, res) => {
  try {
    // get category id
    const { categoryId } = req.body;
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category Id is missing',
      });
    }
    // get courses for specific category id
    const selectedCategory = await Category.findById(categoryId)
      .populate('courses')
      .exec();
    // validation
    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Date not found',
      });
    }
    // get courses for different courses
    const differentCategories = await Category.find({
      _id: { $ne: categoryId }, // where the id is not equal to categoryId
    })
      .populate('courses')
      .exec();

    //get top 10 selling courses
    // get top selling courses (incomplete)
    const { courseId } = req.body; // take the courseId
    const top_selling = await Course.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
      { $project: { studentCount: { $size: '$studentsEnrolled' } } },
    ]);

    // const top_selling_ = await Course.findOne({ _id: courseId });
    // const count = top_selling_.studentsEnrolled.length;
    // console.log(top_selling_);

    // return response
    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategories,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Error while fetching category page details',
    });
  }
};
