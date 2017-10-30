class ProductsController < ApplicationController
  NOT_AUTHENTICATED = [:show_all]
  PAGE_SIZE = 15
  before_action :authenticate_user!, except: NOT_AUTHENTICATED
  layout 'admin', except: NOT_AUTHENTICATED

  def index
    @page = (params[:page] || 0).to_i #Pagination
    if params[:keywords].present?
      @keywords = params[:keywords]
      products_search_term = ProductSearchTerm.new(@keywords)
      @products = Product.where(
        products_search_term.where_clause,
        products_search_term.where_args).
        order(products_search_term.order).
        offset(PAGE_SIZE * @page).limit(PAGE_SIZE)
    else
      @products = []
    end
    respond_to do |format|
      format.html {}
      format.json {
        render json: { products: @products }
      }
    end
  end

  def new
  end

  def show_all
  end
end

