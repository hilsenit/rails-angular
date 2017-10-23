class AddIndexesToProducts < ActiveRecord::Migration[5.1]
  def change
    add_index :products, "lower(title) varchar_pattern_ops"
    add_index :products, "lower(subtitle) varchar_pattern_ops"
    add_index :products, "lower(authors) varchar_pattern_ops"
  end
end
