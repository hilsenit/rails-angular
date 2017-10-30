Rails.application.routes.draw do
  devise_for :users
  resources :products, :orders, :publishers, :blog_posts
  get 'admin' => 'admin#dashboard'
  get 'om-mikrofest' => 'pages#about', as: :about
  get 'kontakt' => 'pages#contact', as: :contact
  root 'pages#index'
end
