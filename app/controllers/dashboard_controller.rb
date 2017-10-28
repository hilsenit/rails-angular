class DashboardController < ApplicationController
  layout 'admin'
  protect_from_forgery with: :exception
  before_action :authenticate_user!
  def index
  end
end
