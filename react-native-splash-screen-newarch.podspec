require "json"

new_arch_enabled = ENV["RCT_NEW_ARCH_ENABLED"] == "1"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = package["name"]
  s.module_name  = "rnsplashscreen"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.author       = package["author"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.platform     = :ios, "15.1"
  s.swift_version = "5.0"
  s.source       = { :git => "https://github.com/TomWq/react-native-splash-screen-newarch.git", :tag => "v#{s.version}" }
  s.source_files  = "ios/*.{h,m,mm,swift}"
  s.dependency "React-Core"

  if new_arch_enabled
    install_modules_dependencies(s)
  end
end
