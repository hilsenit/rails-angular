class PublishersController < ApplicationController
  NOT_AUTHENTICATED = [:show_all]
  before_action :authenticate_user!, except: NOT_AUTHENTICATED
  def index
  end

  def show_all
  end
end
