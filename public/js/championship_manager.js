$(function () {   //$ = Jquery

  var count = 0;

  $('.click-me').click(function() { //'.click-me' => sélecteur css qui va chercher tout avec la classe click-me
    $('p.placeholder').text("Tu as cliqué " +  ++count + " fois.");
    if (count >= 5)
      $('p.placeholder').addClass('too-many-clicks');
  });
});
