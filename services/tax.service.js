import Category from "../models/Category.model.js";
import Subcategory from "../models/Subcategory.model.js";

/**
 * Resolves tax for an item using inheritance
 * Priority:
 * Item -> Subcategory -> Category
 */
export const resolveTax = async (item) => {

  // 1. If item defines tax
  if (item.tax_applicable === true) {
    return {
      tax_applicable: true,
      tax_percentage: item.tax_percentage || 0
    };
  }

  if (item.tax_applicable === false) {
    return {
      tax_applicable: false,
      tax_percentage: 0
    };
  }

  // 2. If item has subcategory
  if (item.subcategory) {
    const subcategory = await Subcategory.findById(item.subcategory);

    if (subcategory) {
      if (subcategory.tax_applicable === true) {
        return {
          tax_applicable: true,
          tax_percentage: subcategory.tax_percentage || 0
        };
      }

      if (subcategory.tax_applicable === false) {
        return {
          tax_applicable: false,
          tax_percentage: 0
        };
      }

      // 3. Fallback to category from subcategory
      const category = await Category.findById(subcategory.category);

      if (category && category.tax_applicable) {
        return {
          tax_applicable: true,
          tax_percentage: category.tax_percentage || 0
        };
      }
    }
  }

  // 4. If item directly belongs to category
  if (item.category) {
    const category = await Category.findById(item.category);

    if (category && category.tax_applicable) {
      return {
        tax_applicable: true,
        tax_percentage: category.tax_percentage || 0
      };
    }
  }

  // 5. Default → no tax
  return {
    tax_applicable: false,
    tax_percentage: 0
  };
};
