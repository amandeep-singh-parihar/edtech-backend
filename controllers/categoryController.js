const Category = require('../models/Category.model');
const Course = require('../models/Course.model');
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
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
      .populate({
        path: 'courses',
        match: { status: 'Published' },
        populate: 'ratingAndreviews',
      })
      .exec();

    // validation
    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Date not found',
      });
    }

    if (selectedCategory.courses.length === 0) {
      console.log('No courses found for the selected category.');
      return res.status(404).json({
        success: false,
        message: 'No courses found for the selected category',
      });
    }

    const categoriesExceptSeleted = await Category.find({
      _id: { $ne: categoryId },
    });

    // get courses for different courses
    const differentCategory = await Category.findOne({
      _id: categoriesExceptSeleted[getRandomInt(categoriesExceptSeleted.length)]
        ._id,
    })
      .populate({
        path: 'courses',
        match: { status: 'Published' },
      })
      .exec();

    const allCategories = await Category.find()
      .populate({
        path: 'courses',
        match: { status: 'Published' },
        populate: {
          path: 'instructor',
        },
      })
      .exec();

    const allCourses = allCategories.flatMap((category) => category.courses);
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    // return response
    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
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
