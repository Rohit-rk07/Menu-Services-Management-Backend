import Category from "../models/Category.model.js";

/**
 * Create Category
 */
export const createCategory = async (data) => {
  return await Category.create(data);
};

/**
 * Get all categories with pagination, sorting, filtering
 */
export const getAllCategories = async (query) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
    active
  } = query;

  const filter = {};
  if (active !== undefined) {
    filter.is_active = active === "true";
  }

  const skip = (page - 1) * limit;

  const categories = await Category.find(filter)
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Category.countDocuments(filter);

  return {
    data: categories,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single category
 */
export const getCategoryById = async (id) => {
  return await Category.findById(id);
};

/**
 * Update category
 */
export const updateCategory = async (id, data) => {
  return await Category.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Soft delete category
 */
export const softDeleteCategory = async (id) => {
  return await Category.findByIdAndUpdate(
    id,
    { is_active: false },
    { new: true }
  );
};

