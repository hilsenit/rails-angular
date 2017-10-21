class CreateProducts < ActiveRecord::Migration[5.1]
  def change
    create_table :products do |t|
      t.text :authors, null: false
      t.string :title, null: false
      t.string :subtitle, null: false
      t.integer :numberofpages, null: false

      t.timestamps null: false
    end
    add_index :products, :authors, unique: true
    add_index :products, :title, unique: true
  end
end
