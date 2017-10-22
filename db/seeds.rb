10000.times do |i|
  Product.create!(
    authors: Faker::Name.first_name + i.to_s,
    title: Faker::Internet.user_name + i.to_s,
    subtitle: Faker::Company.bs,
    numberofpages: Faker::Number.number(2).to_i
  )
  print '.' if i % 1000 == 0
end


