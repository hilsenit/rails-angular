require 'rails_helper'

describe "rspec is configures properly" do
  it "should pass" do
    expect(true).to eq(true)
  end

  it "can fail" do
    expect(false).to eq(true)
  end
end
