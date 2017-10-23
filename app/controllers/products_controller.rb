class ProductsController < ApplicationController

  def index
    if params[:keywords].present?
      @keywords = params[:keywords]
      products_search_term = ProductSearchTerm.new(@keywords)
      @products = Product.where(
        products_search_term.where_clause,
        products_search_term.where_args).
        order(products_search_term.order) # Beautiful!
    else
      @products = []
    end
  end

end

