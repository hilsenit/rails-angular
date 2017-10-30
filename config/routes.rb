Rails.application.routes.draw do
  devise_for :users
  resources :products, :orders, :publishers, :blog_posts
  get 'udgivelser-boeger' => 'products#show_all', as: :show_all_products
  get 'mikro-forlag' => 'publishers#show_all', as: :show_all_publishers
  get 'admin' => 'admin#dashboard'
  get 'om-mikrofest' => 'pages#about', as: :about
  get 'kontakt' => 'pages#contact', as: :contact
  root to: 'pages#index'
end
