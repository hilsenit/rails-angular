Rails.application.routes.draw do
  devise_for :users
<<<<<<< HEAD
  resources :products, :orders, :publishers, :blog_posts
  get 'admin' => 'admin#dashboard'
=======
  resources :products, only: [:index, :new]
  get 'dashboard' => 'dashboard#index', as: :dashboard
>>>>>>> 6aff0183436088cd4a66efb6b64d4c7dd56661b8
  get 'om-mikrofest' => 'pages#about', as: :about
  get 'kontakt' => 'pages#contact', as: :contact
  root 'pages#index'
end
