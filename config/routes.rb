Rails.application.routes.draw do
  devise_for :users
  resources :products, only: :index
  get 'dashboard' => 'dashboard#index'
  get 'om-mikrofest' => 'pages#about', as: :about
  get 'kontakt' => 'pages#contact', as: :contact
  root 'pages#index'
end
