$(function () {
  User.find(null).exec(function (err, users) {
		console.log(users);
    users.forEach(function (user) {
      $('p.listmember').text(user);  		
    });
  });
});
