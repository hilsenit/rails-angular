require 'rails_helper'

describe "Navbar Routes" do
  it "should have some links that points in certain directions" do
    visit root_path()
    within(".navbar") do
      expect(page).to have_content("Bøger")
      expect(page).to have_content("Forlag")
      expect(page).to have_content("Om")
      expect(page).to have_content("Kontakt")
      # Logo
      expect(page).to have_content("Mikrofest")
    end
  end

  it "should point to the right paths" do
    visit root_path()
    click_link("Bøger")
    expect(current_path).to eq("/udgivelser-boeger")
    click_link("Forlag")
    expect(current_path).to eq("/mikro-forlag")
    click_link("Om")
    expect(current_path).to eq("/om-mikrofest")
    click_link("Kontakt")
    expect(current_path).to eq("/kontakt")
  end
end
