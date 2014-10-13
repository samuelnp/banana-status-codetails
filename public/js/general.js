// where our WebSockets logic will go later

function connect() {
  try {
    socket = new WebSocket(wshost);

    socket.onopen = function() {
      addMessage("Socket Status: " + socket.readyState + " (open)");
    }

    socket.onclose = function() {
      addMessage("Socket Status: " + socket.readyState + " (closed)");
    }

    socket.onmessage = function(msg) {
      addMessage("Received: " + msg.data);
      message = JSON.parse(msg.data);
      
      var rendered = Mustache.render(template, {icon: image_path + message.icon, user: message.user, time: message.localtime, avatar: message.avatar});
      console.log(rendered);
      $('#content').prepend(rendered);

      notifyMe({
        user: message.user,
        localtime: message.localtime,
        icon: message.icon
      });
    }
  } catch(exception) {
    addMessage("Error: " + exception);
  }
}

function addMessage(msg) {
  console.log(msg);
}

function send(element) {
  var message = {
      user: app_user ,
      localtime: new Date().toLocaleTimeString(),
      icon: element,
      avatar: avatar_path,
  }

  try {
    
    socket.send(JSON.stringify(message));
    addMessage("Sent: " + message);
  } catch(exception) {
    addMessage("Failed To Send")
  }

  var rendered = Mustache.render(template, {icon: image_path + message.icon, user: message.user, time: message.localtime, avatar: message.avatar});
  $('#content').prepend(rendered);
}

$(function() {
  connect();
});

$("#disconnect").click(function() {
  socket.close()
});

$(".msg-icon").click(function(){
  send($(this).data("icon"));
});

function notifyMe(message) {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check if the user is okay to get some notification
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    options = {
        body: message.localtime,
        tag: 'notification',
        icon: image_path + message.icon
      };
    var notification = new Notification(message.user, options);
  }

  // Otherwise, we need to ask the user for permission
  // Note, Chrome does not implement the permission static property
  // So we have to check for NOT 'denied' instead of 'default'
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {

      // Whatever the user answers, we make sure we store the information
      if(!('permission' in Notification)) {
        Notification.permission = permission;
      }

    });
  }

  // At last, if the user already denied any notification, and you 
  // want to be respectful there is no need to bother him any more.
}

function initMoustache() {
  template = $('#template').html();
  Mustache.parse(template);   // optional, speeds up future uses
}