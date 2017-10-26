# -*- encoding: utf-8 -*-
# stub: webpacker 3.0.2 ruby lib

Gem::Specification.new do |s|
  s.name = "webpacker".freeze
  s.version = "3.0.2"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["David Heinemeier Hansson".freeze, "Gaurav Tiwari".freeze]
  s.bindir = "exe".freeze
  s.date = "2017-10-25"
  s.email = ["david@basecamp.com".freeze, "gaurav@gauravtiwari.co.uk".freeze]
  s.executables = ["webpack".freeze, "webpack-dev-server".freeze]
  s.files = [".eslintignore".freeze, ".eslintrc.js".freeze, ".gitignore".freeze, ".rubocop.yml".freeze, ".travis.yml".freeze, "CHANGELOG.md".freeze, "Gemfile".freeze, "Gemfile.lock".freeze, "MIT-LICENSE".freeze, "README.md".freeze, "Rakefile".freeze, "docs/assets.md".freeze, "docs/css.md".freeze, "docs/deployment.md".freeze, "docs/env.md".freeze, "docs/es6.md".freeze, "docs/folder-structure.md".freeze, "docs/misc.md".freeze, "docs/props.md".freeze, "docs/testing.md".freeze, "docs/troubleshooting.md".freeze, "docs/typescript.md".freeze, "docs/webpack-dev-server.md".freeze, "docs/webpack.md".freeze, "docs/yarn.md".freeze, "exe/webpack".freeze, "exe/webpack-dev-server".freeze, "gemfiles/Gemfile-rails-edge".freeze, "gemfiles/Gemfile-rails.4.2.x".freeze, "gemfiles/Gemfile-rails.5.0.x".freeze, "gemfiles/Gemfile-rails.5.1.x".freeze, "lib/install/angular.rb".freeze, "lib/install/config/.babelrc".freeze, "lib/install/config/.postcssrc.yml".freeze, "lib/install/config/webpack/development.js".freeze, "lib/install/config/webpack/environment.js".freeze, "lib/install/config/webpack/production.js".freeze, "lib/install/config/webpack/test.js".freeze, "lib/install/config/webpacker.yml".freeze, "lib/install/elm.rb".freeze, "lib/install/examples/angular/hello_angular.js".freeze, "lib/install/examples/angular/hello_angular/app/app.component.ts".freeze, "lib/install/examples/angular/hello_angular/app/app.module.ts".freeze, "lib/install/examples/angular/hello_angular/index.ts".freeze, "lib/install/examples/angular/hello_angular/polyfills.ts".freeze, "lib/install/examples/angular/tsconfig.json".freeze, "lib/install/examples/elm/Main.elm".freeze, "lib/install/examples/elm/hello_elm.js".freeze, "lib/install/examples/react/.babelrc".freeze, "lib/install/examples/react/hello_react.jsx".freeze, "lib/install/examples/vue/app.vue".freeze, "lib/install/examples/vue/hello_vue.js".freeze, "lib/install/javascript/packs/application.js".freeze, "lib/install/react.rb".freeze, "lib/install/template.rb".freeze, "lib/install/vue.rb".freeze, "lib/tasks/installers.rake".freeze, "lib/tasks/webpacker.rake".freeze, "lib/tasks/webpacker/check_binstubs.rake".freeze, "lib/tasks/webpacker/check_node.rake".freeze, "lib/tasks/webpacker/check_yarn.rake".freeze, "lib/tasks/webpacker/clobber.rake".freeze, "lib/tasks/webpacker/compile.rake".freeze, "lib/tasks/webpacker/install.rake".freeze, "lib/tasks/webpacker/verify_install.rake".freeze, "lib/tasks/webpacker/yarn_install.rake".freeze, "lib/webpacker.rb".freeze, "lib/webpacker/commands.rb".freeze, "lib/webpacker/compiler.rb".freeze, "lib/webpacker/configuration.rb".freeze, "lib/webpacker/dev_server.rb".freeze, "lib/webpacker/dev_server_proxy.rb".freeze, "lib/webpacker/dev_server_runner.rb".freeze, "lib/webpacker/helper.rb".freeze, "lib/webpacker/instance.rb".freeze, "lib/webpacker/manifest.rb".freeze, "lib/webpacker/railtie.rb".freeze, "lib/webpacker/runner.rb".freeze, "lib/webpacker/version.rb".freeze, "lib/webpacker/webpack_runner.rb".freeze, "package.json".freeze, "package/asset_host.js".freeze, "package/config.js".freeze, "package/environment.js".freeze, "package/environments/development.js".freeze, "package/environments/production.js".freeze, "package/environments/test.js".freeze, "package/index.js".freeze, "package/loaders/babel.js".freeze, "package/loaders/coffee.js".freeze, "package/loaders/elm.js".freeze, "package/loaders/erb.js".freeze, "package/loaders/file.js".freeze, "package/loaders/style.js".freeze, "package/loaders/typescript.js".freeze, "package/loaders/vue.js".freeze, "test/command_test.rb".freeze, "test/compiler_test.rb".freeze, "test/configuration_test.rb".freeze, "test/dev_server_test.rb".freeze, "test/helper_test.rb".freeze, "test/manifest_test.rb".freeze, "test/rake_tasks_test.rb".freeze, "test/test_app/Rakefile".freeze, "test/test_app/config/application.rb".freeze, "test/test_app/config/environment.rb".freeze, "test/test_app/public/packs/manifest.json".freeze, "test/test_helper.rb".freeze, "webpacker.gemspec".freeze, "yarn.lock".freeze]
  s.homepage = "https://github.com/rails/webpacker".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.2.0".freeze)
  s.rubygems_version = "2.6.12".freeze
  s.summary = "Use webpack to manage app-like JavaScript modules in Rails".freeze
  s.test_files = ["test/command_test.rb".freeze, "test/compiler_test.rb".freeze, "test/configuration_test.rb".freeze, "test/dev_server_test.rb".freeze, "test/helper_test.rb".freeze, "test/manifest_test.rb".freeze, "test/rake_tasks_test.rb".freeze, "test/test_app/Rakefile".freeze, "test/test_app/config/application.rb".freeze, "test/test_app/config/environment.rb".freeze, "test/test_app/public/packs/manifest.json".freeze, "test/test_helper.rb".freeze]

  s.installed_by_version = "2.6.12" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<activesupport>.freeze, [">= 4.2"])
      s.add_runtime_dependency(%q<railties>.freeze, [">= 4.2"])
      s.add_runtime_dependency(%q<rack-proxy>.freeze, [">= 0.6.1"])
      s.add_development_dependency(%q<bundler>.freeze, ["~> 1.12"])
    else
      s.add_dependency(%q<activesupport>.freeze, [">= 4.2"])
      s.add_dependency(%q<railties>.freeze, [">= 4.2"])
      s.add_dependency(%q<rack-proxy>.freeze, [">= 0.6.1"])
      s.add_dependency(%q<bundler>.freeze, ["~> 1.12"])
    end
  else
    s.add_dependency(%q<activesupport>.freeze, [">= 4.2"])
    s.add_dependency(%q<railties>.freeze, [">= 4.2"])
    s.add_dependency(%q<rack-proxy>.freeze, [">= 0.6.1"])
    s.add_dependency(%q<bundler>.freeze, ["~> 1.12"])
  end
end
