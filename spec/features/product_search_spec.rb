require 'rails_helper'

feature 'product search' do
  let(:email) {"username@mail.dk"}
  let(:username) {"bennyhiller"}

end

def create_test_user(email: , password:)
  User.create!(
    email: email,
    password: password,
    password_confirmation: password
  )
end

# For at jeg og senere udvikler tydeligt kan se hvilken test-data, som det er vi arbejder med.
def create_product(title: , subtitle:, authors: )
  title ||= "#{Faker::Internet.username}#{rand(1000)}"
  subtitle ||= Faker::Internet.domain_name
  authors ||= Faker::FamilyGuy.character

  Product.create!(
    title: title,
    subtitle: subtitle,
    authors: authors
  )
end

