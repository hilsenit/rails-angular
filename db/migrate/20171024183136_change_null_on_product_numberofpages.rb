class ChangeNullOnProductNumberofpages < ActiveRecord::Migration[5.1]
  def change
    change_column_null :products, :numberofpages, true
    change_column_default :products, :numberofpages, 0
  end
end
