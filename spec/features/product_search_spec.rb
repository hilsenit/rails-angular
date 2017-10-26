require 'rails_helper'

feature 'product search' do
  let(:email) {"username@mail.dk"}
  let(:password) {"passwordpassword"}

  before do
    create_test_user(email, password)

    create_product("Christan", "Zebra", "Andersen")
    create_product("Mathias", "Aude", "Zebra")
    create_product("Zebaa", "Zulu", "Hest")
    create_product("Aaaaaaaaa", "Zebra", "Aaaaaaa") # Første produkt, der bliver vis

  end

  scenario "Search by title" do
    visit root_path
    fill_in "Email", with: email
    fill_in "Password", with: password
    click_button "Log in"

    click_link "Gå til produktsøgning"

    within ".search-form" do
      fill_in "keywords", with: "Zeb"
    end

    within "section.search-results" do
      expect(page).to have_content("Zebra")
      list_group_items = page.all("ol li.list-group-item")
      expect(list_group_items.count).to eq(4)
      expect(list_group_items[0]).to have_content("Zebaa") # Er det sorteret rigtigt?
    end

  end
end

def create_test_user email, password
  User.create!(
    email: email,
    password: password,
    password_confirmation: password
  )
end

# For at jeg og senere udvikler tydeligt kan se hvilken test-data, som det er vi arbejder med.
def create_product title, subtitle, authors
  title ||= Faker::Internet.username
  subtitle ||= Faker::Internet.domain_name
  authors ||= Faker::FamilyGuy.character

  Product.create!(
    title: title,
    subtitle: subtitle,
    authors: authors
  )
end

