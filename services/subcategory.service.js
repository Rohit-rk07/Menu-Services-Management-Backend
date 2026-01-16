import Subcategory from "../models/Subcategory.model.js";
import Category from "../models/Category.model.js";

export const createSubcategory = async (data) => {
  // check parent category exists & active
  const category = await Category.findById(data.category);
  if (!category) throw new Error("Parent category not found");
  if (!category.is_active) throw new Error("Cannot add subcategory to inactive category");

  return await Subcategory.create(data);
};

export const getAllSubcategories = async (query) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
    active,
    categoryId
  } = query;

  const filter = {};

  if (active !== undefined) {
    filter.is_active = active === "true";
  }

  if (categoryId) {
    filter.category = categoryId;
  }

  const skip = (page - 1) * limit;

  const subcategories = await Subcategory.find(filter)
    .populate("category", "name is_active")
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Subcategory.countDocuments(filter);

  return {
    data: subcategories,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getSubcategoryById = async (id) => {
  return await Subcategory.findById(id).populate("category", "name is_active");
};

export const updateSubcategory = async (id, data) => {
  return await Subcategory.findByIdAndUpdate(id, data, { new: true });
};

export const softDeleteSubcategory = async (id) => {
  return await Subcategory.findByIdAndUpdate(
    id,
    { is_active: false },
    { new: true }
  );
};
