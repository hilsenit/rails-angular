Rails.application.routes.draw do
  devise_for :users
  resources :products, only: [:index, :new]
  get 'dashboard' => 'dashboard#index', as: :dashboard
  get 'om-mikrofest' => 'pages#about', as: :about
  get 'kontakt' => 'pages#contact', as: :contact
  root 'pages#index'
end
