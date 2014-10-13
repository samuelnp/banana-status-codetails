
require 'thin'
require 'em-websocket'
require 'sinatra/base'
require 'omniauth-twitter'
require 'pry'
require 'json'

EM.run do
  class App < Sinatra::Base

    set :static, true
    info = nil
    configure do
      enable :sessions

      use OmniAuth::Builder do
        provider :twitter, ENV['CONSUMER_KEY'], ENV['CONSUMER_SECRET']
      end
    end

    helpers do
      # define a current_user method, so we can be sure if an user is authenticated
      def current_user
        !session[:uid].nil?
      end
    end

    before do
      # we do not want to redirect to twitter when the path info starts
      # with /auth/
      pass if request.path_info =~ /^\/auth\//

      # /auth/twitter is captured by omniauth:
      # when the path info matches /auth/twitter, omniauth will redirect to twitter
      redirect to('/auth/twitter') unless current_user
    end

    get '/auth/twitter/callback' do
      # probably you will need to create a user in the database too...
      session[:uid] = env['omniauth.auth']['uid']
      session[:avatar] = env['omniauth.auth']['info']['image']
      session[:name] = env['omniauth.auth']['info']['nickname']
      # this is the main endpoint to your application
      redirect to('/')
    end

    get "/" do
      erb :index
    end

    get '/auth/failure' do
      # omniauth redirects to /auth/failure when it encounters a problem
      # so you can implement this as you please
    end
  end

  @clients = []

  EM::WebSocket.start(:host => '0.0.0.0', :port => '3001') do |ws|
    ws.onopen do |handshake|
      @clients << ws
      ws.send "Connected to #{handshake.path} #{ws}."
    end

    ws.onclose do
      ws.send "Closed."
      @clients.delete ws
    end

    ws.onmessage do |msg|
      puts "Received Message: #{msg}"

      if @clients.size > 1
        @clients.each do |socket|
          unless socket == ws
            socket.send (msg)
          end
        end
      end
    end
  end

  App.run! :port => 3000
end
