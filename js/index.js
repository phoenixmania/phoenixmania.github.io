;(function(window, undefined) {

'use strict';

var AudioPlayer = (function() {

  // Player vars
  var
  player = document.getElementById('ap'),
  playBtn,
  prevBtn,
  nextBtn,
  plBtn,
  repeatBtn,
  volumeBtn,
  progressBar,
  preloadBar,
  curTime,
  durTime,
  trackTitle,
  audio,
  index = 0,
  playList,
  volumeBar,
  volumeLength,
  repeating = false,
  seeking = false,
  rightClick = false,
  apActive = false,
  // playlist vars
  pl,
  plLi,
  // settings
  settings = {
    volume   : .8,
    autoPlay : true,
    notification: false,
    playList : []
  };

  function init(options) {

    if(!('classList' in document.documentElement)) {
      return false;
    }

    if(apActive || player === null) {
      return;
    }

    settings = extend(settings, options);

    // get player elements
    playBtn        = player.querySelector('.ap-toggle-btn');
    prevBtn        = player.querySelector('.ap-prev-btn');
    nextBtn        = player.querySelector('.ap-next-btn');
    repeatBtn      = player.querySelector('.ap-repeat-btn');
    volumeBtn      = player.querySelector('.ap-volume-btn');
    plBtn          = player.querySelector('.ap-playlist-btn');
    curTime        = player.querySelector('.ap-time--current');
    durTime        = player.querySelector('.ap-time--duration');
    trackTitle     = player.querySelector('.ap-title');
    progressBar    = player.querySelector('.ap-bar');
    preloadBar     = player.querySelector('.ap-preload-bar');
    volumeBar      = player.querySelector('.ap-volume-bar');

    playList = shuffle(settings.playList);

    playBtn.addEventListener('click', playToggle, false);
    volumeBtn.addEventListener('click', volumeToggle, false);
    repeatBtn.addEventListener('click', repeatToggle, false);

    progressBar.parentNode.parentNode.addEventListener('mousedown', handlerBar, false);
    progressBar.parentNode.parentNode.addEventListener('mousemove', seek, false);
    document.documentElement.addEventListener('mouseup', seekingFalse, false);

    volumeBar.parentNode.parentNode.addEventListener('mousedown', handlerVol, false);
    volumeBar.parentNode.parentNode.addEventListener('mousemove', setVolume);
    document.documentElement.addEventListener('mouseup', seekingFalse, false);

    prevBtn.addEventListener('click', prev, false);
    nextBtn.addEventListener('click', next, false);


    apActive = true;

    // Create playlist
    renderPL();
    plBtn.addEventListener('click', plToggle, false);

    // Create audio object
    audio = new Audio();
    audio.volume = settings.volume;



    if(isEmptyList()) {
      empty();
      return;
    }

    audio.src = playList[index].file;
    audio.preload = 'auto';
    trackTitle.innerHTML = playList[index].title;
    volumeBar.style.height = audio.volume * 100 + '%';
    volumeLength = volumeBar.css('height');

    audio.addEventListener('error', error, false);
    audio.addEventListener('timeupdate', update, false);
    audio.addEventListener('ended', doEnd, false);

    if(settings.autoPlay) {
      audio.play();
      playBtn.classList.add('playing');
      plLi[index].classList.add('pl-current');
    }
  }

/**
 *  PlayList methods
 */
    function renderPL() {
      var html = [];
      var tpl =
        '<li data-track="{count}">'+
          '<div class="pl-number">'+
            '<div class="pl-count">'+
              '<svg fill="#000000" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">'+
                  '<path d="M0 0h24v24H0z" fill="none"/>'+
                  '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>'+
              '</svg>'+
            '</div>'+
            '<div class="pl-playing">'+
              '<div class="eq">'+
                '<div class="eq-bar"></div>'+
                '<div class="eq-bar"></div>'+
                '<div class="eq-bar"></div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="pl-title">{title}</div>'+
          '<button class="pl-remove">'+
              '<svg fill="#000000" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">'+
                  '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>'+
                  '<path d="M0 0h24v24H0z" fill="none"/>'+
              '</svg>'+
          '</button>'+
        '</li>';

      playList.forEach(function(item, i) {
        html.push(
          tpl.replace('{count}', i).replace('{title}', item.title)
        );
      });

      pl = create('div', {
        'className': 'pl-container hide',
        'id': 'pl',
        'innerHTML': !isEmptyList() ? '<ul class="pl-list">' + html.join('') + '</ul>' : '<div class="pl-empty">PlayList is empty</div>'
      });

      player.parentNode.insertBefore(pl, player.nextSibling);

      plLi = pl.querySelectorAll('li');

      pl.addEventListener('click', listHandler, false);
    }

    function listHandler(evt) {
      evt.preventDefault();
      if(evt.target.className === 'pl-title') {
        var current = parseInt(evt.target.parentNode.getAttribute('data-track'), 10);
        index = current;
        play();
        plActive();
      }
      else {
        var target = evt.target;
        while(target.className !== pl.className) {
          if(target.className === 'pl-remove') {
            var isDel = parseInt(target.parentNode.getAttribute('data-track'), 10);

            playList.splice(isDel, 1);
            target.parentNode.parentNode.removeChild(target.parentNode);

            plLi = pl.querySelectorAll('li');

            [].forEach.call(plLi, function(el, i) {
              el.setAttribute('data-track', i);
            });

            if(!audio.paused) {

              if(isDel === index) {
                play();
              }

            }
            else {
              if(isEmptyList()) {
                empty();
              }
              else {
                // audio.currentTime = 0;
                audio.src = playList[index].file;
                document.title = trackTitle.innerHTML = playList[index].title;
                progressBar.style.width = 0;
              }
            }
            if(isDel < index) {
              index--;
            }

            return;
          }
          target = target.parentNode;
        }

      }
    }

    function plActive() {
      if(audio.paused) {
        plLi[index].classList.remove('pl-current');
        return;
      }
      var current = index;
      for(var i = 0, len = plLi.length; len > i; i++) {
        plLi[i].classList.remove('pl-current');
      }
      plLi[current].classList.add('pl-current');
    }


/**
 *  Player methods
 */
  function error() {
    !isEmptyList() && next();
  }
  function play() {

    index = (index > playList.length - 1) ? 0 : index;
    if(index < 0) index = playList.length - 1;

    if(isEmptyList()) {
      empty();
      return;
    }

    audio.src = playList[index].file;
    audio.preload = 'auto';
    document.title = trackTitle.innerHTML = playList[index].title;
    audio.play();
    notify(playList[index].title, {
      icon: playList[index].icon,
      body: 'Now playing',
      tag: 'music-player'
    });
    playBtn.classList.add('playing');
    plActive();
  }

  function prev() {
    index = index - 1;
    play();
  }

  function next() {
    index = index + 1;
    play();
  }

  function isEmptyList() {
    return playList.length === 0;
  }

  function empty() {
    audio.pause();
    audio.src = '';
    trackTitle.innerHTML = 'queue is empty';
    curTime.innerHTML = '--';
    durTime.innerHTML = '--';
    progressBar.style.width = 0;
    preloadBar.style.width = 0;
    playBtn.classList.remove('playing');
    pl.innerHTML = '<div class="pl-empty">PlayList is empty</div>';
  }

  function playToggle() {
    if(isEmptyList()) {
      return;
    }
    if(audio.paused) {
      audio.play();
      notify(playList[index].title, {
        icon: playList[index].icon,
        body: 'Now playing'
      });
      this.classList.add('playing');
    }
    else {
      audio.pause();
      this.classList.remove('playing');
    }
    plActive();
  }

  function volumeToggle() {
    if(audio.muted) {
      if(parseInt(volumeLength, 10) === 0) {
        volumeBar.style.height = '100%';
        audio.volume = 1;
      }
      else {
        volumeBar.style.height = volumeLength;
      }
      audio.muted = false;
      this.classList.remove('muted');
    }
    else {
      audio.muted = true;
      volumeBar.style.height = 0;
      this.classList.add('muted');
    }
  }

  function repeatToggle() {
    var repeat = this.classList;
    if(repeat.contains('ap-active')) {
      repeating = false;
      repeat.remove('ap-active');
    }
    else {
      repeating = true;
      repeat.add('ap-active');
    }
  }

  function plToggle() {
    this.classList.toggle('ap-active');
    pl.classList.toggle('hide');
  }

  function update() {
    if(audio.readyState === 0) return;

    var barlength = Math.round(audio.currentTime * (100 / audio.duration));
    progressBar.style.width = barlength + '%';

    var
    curMins = Math.floor(audio.currentTime / 60),
    curSecs = Math.floor(audio.currentTime - curMins * 60),
    mins = Math.floor(audio.duration / 60),
    secs = Math.floor(audio.duration - mins * 60);
    (curSecs < 10) && (curSecs = '0' + curSecs);
    (secs < 10) && (secs = '0' + secs);

    curTime.innerHTML = curMins + ':' + curSecs;
    durTime.innerHTML = mins + ':' + secs;

    var buffered = audio.buffered;
    if(buffered.length) {
      var loaded = Math.round(100 * buffered.end(0) / audio.duration);
      preloadBar.style.width = loaded + '%';
    }
  }

  function doEnd() {
    if(index === playList.length - 1) {
      if(!repeating) {
        audio.pause();
        plActive();
        playBtn.classList.remove('playing');
        return;
      }
      else {
        index = 0;
        play();
      }
    }
    else {
      index = (index === playList.length - 1) ? 0 : index + 1;
      play();
    }
  }

  function moveBar(evt, el, dir) {
    var value;
    if(dir === 'horizontal') {
      value = Math.round( ((evt.clientX - el.offset().left) + window.pageXOffset) * 100 / el.parentNode.offsetWidth);
      el.style.width = value + '%';
      return value;
    }
    else {
      var offset = (el.offset().top + el.offsetHeight)  - window.pageYOffset;
      value = Math.round((offset - evt.clientY));
      if(value > 100) value = 100;
      if(value < 0) value = 0;
      volumeBar.style.height = value + '%';
      return value;
    }
  }

  function handlerBar(evt) {
    rightClick = (evt.which === 3) ? true : false;
    seeking = true;
    seek(evt);
  }

  function handlerVol(evt) {
    rightClick = (evt.which === 3) ? true : false;
    seeking = true;
    setVolume(evt);
  }

  function seek(evt) {
    if(seeking && rightClick === false && audio.readyState !== 0) {
      var value = moveBar(evt, progressBar, 'horizontal');
      audio.currentTime = audio.duration * (value / 100);
    }
  }

  function seekingFalse() {
    seeking = false;
  }

  function setVolume(evt) {
    volumeLength = volumeBar.css('height');
    if(seeking && rightClick === false) {
      var value = moveBar(evt, volumeBar.parentNode, 'vertical') / 100;
      if(value <= 0) {
        audio.volume = 0;
        volumeBtn.classList.add('muted');
      }
      else {
        if(audio.muted) audio.muted = false;
        audio.volume = value;
        volumeBtn.classList.remove('muted');
      }
    }
  }

  function notify(title, attr) {
    if(!settings.notification) {
      return;
    }
    if(window.Notification === undefined) {
      return;
    }
    window.Notification.requestPermission(function(access) {
      if(access === 'granted') {
        var notice = new Notification(title.substr(0, 110), attr);
        notice.onshow = function() {
          setTimeout(function() {
            notice.close();
          }, 5000);
        }
        notice.onclose = function() {
          if(noticeTimer) {
            clearTimeout(noticeTimer);
         }
     }
      }
    })
  }

/* Destroy method. Clear All */
  function destroy() {
    if(!apActive) return;

    playBtn.removeEventListener('click', playToggle, false);
    volumeBtn.removeEventListener('click', volumeToggle, false);
    repeatBtn.removeEventListener('click', repeatToggle, false);
    plBtn.removeEventListener('click', plToggle, false);

    progressBar.parentNode.parentNode.removeEventListener('mousedown', handlerBar, false);
    progressBar.parentNode.parentNode.removeEventListener('mousemove', seek, false);
    document.documentElement.removeEventListener('mouseup', seekingFalse, false);

    volumeBar.parentNode.parentNode.removeEventListener('mousedown', handlerVol, false);
    volumeBar.parentNode.parentNode.removeEventListener('mousemove', setVolume);
    document.documentElement.removeEventListener('mouseup', seekingFalse, false);

    prevBtn.removeEventListener('click', prev, false);
    nextBtn.removeEventListener('click', next, false);

    audio.removeEventListener('error', error, false);
    audio.removeEventListener('timeupdate', update, false);
    audio.removeEventListener('ended', doEnd, false);
    player.parentNode.removeChild(player);

    // Playlist
    pl.removeEventListener('click', listHandler, false);
    pl.parentNode.removeChild(pl);

    audio.pause();
    apActive = false;
  }


/**
 *  Helpers
 */
  function extend(defaults, options) {
    for(var name in options) {
      if(defaults.hasOwnProperty(name)) {
        defaults[name] = options[name];
      }
    }
    return defaults;
  }

  function create(el, attr) {
    var element = document.createElement(el);
    if(attr) {
      for(var name in attr) {
        if(element[name] !== undefined) {
          element[name] = attr[name];
        }
      }
    }
    return element;
  }

  /**
   * Shuffles array in place.
   * @param {Array} a items An array containing the items.
   */
  function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
  }


  Element.prototype.offset = function() {
    var el = this.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    return {
      top: el.top + scrollTop,
      left: el.left + scrollLeft
    };
  };

  Element.prototype.css = function(attr) {
    if(typeof attr === 'string') {
      return getComputedStyle(this, '')[attr];
    }
    else if(typeof attr === 'object') {
      for(var name in attr) {
        if(this.style[name] !== undefined) {
          this.style[name] = attr[name];
        }
      }
    }
  };


/**
 *  Public methods
 */
  return {
    init: init,
    destroy: destroy
  };

})();

window.AP = AudioPlayer;

})(window);


// test image for web notifications
var iconImage = 'http://funkyimg.com/i/21pX5.png';

AP.init({
  playList: [
      {'icon': iconImage, 'title': 'Amour plastique by Videoclub', 'file':'ding/amour-plastique.mp3'},//couster
      {'icon': iconImage, 'title': 'Roi by Videoclub', 'file':'ding/roi.mp3'},//couster
      //update27-11-2019
      {'icon': iconImage, 'title': 'Release Me On The Floor by Figurines', 'file':'ding/release-me-on-the-floor.mp3'},//couster
      {'icon': iconImage, 'title': 'California (All The Way) by Luna', 'file':'ding/california-1.mp3'},//couster
      {'icon': iconImage, 'title': 'Yoshimi Battle the Pink Robots by The Flaming Lips', 'file':'ding/yoshimi-battle.mp3'},//couster
      {'icon': iconImage, 'title': 'Normandie by Shout Out Louds', 'file':'ding/normandie.mp3'},//couster
      {'icon': iconImage, 'title': 'Outlined view by Ms. John Soda', 'file':'ding/outlined-view.mp3'},//couster
      //update06-11-2019
      {'icon': iconImage, 'title': 'It´s Late by A Beacon School', 'file':'ding/it-s-late.mp3'},//couster
      {'icon': iconImage, 'title': 'Neighborhood #1 (Tunnels) by Arcade Fire', 'file':'ding/neighborhood-1.mp3'},//Couster
      {'icon': iconImage, 'title': 'Suburban War by Arcade Fire', 'file':'ding/suburban-war.mp3'},//couster
      {'icon': iconImage, 'title': 'Chained by The XX', 'file':'ding/chained.mp3'},//Couster
      //24-sep-2019
      {'icon': iconImage, 'title': 'In The Middle of The Night by Still Corners', 'file':'ding/in-the-middle-of-the-night.mp3'},//reco
      {'icon': iconImage, 'title': 'Featherstone by The Paper Kites', 'file':'ding/featherstone.mp3'},//reco
      {'icon': iconImage, 'title': 'North by Phoenix', 'file':'ding/north.mp3'},//couster
      {'icon': iconImage, 'title': 'New Attitude by The Babe Rainbow', 'file':'ding/new-attitude.mp3'},//reco
      {'icon': iconImage, 'title': 'Sour Fruit by MELT', 'file':'ding/sour-fruit.mp3'},//reco
      {'icon': iconImage, 'title': 'Blue by Far Caspian', 'file':'ding/blue.mp3'},//reco
      {'icon': iconImage, 'title': 'The Magician by The Babe Rainbow', 'file':'ding/the-magician-.mp3'},//reco
      {'icon': iconImage, 'title': 'Sprawl II (Mountains Beyond Mountains) by Arcade Fire', 'file':'ding/sprawl-II.mp3'},//reco
      {'icon': iconImage, 'title': 'All I Need by Air', 'file':'ding/all-i-need.mp3'},//reco
      {'icon': iconImage, 'title': 'La Femme à la Peau Bleue by Vendredi sur Mer', 'file':'ding/la-femme-a-la-peau-bleue.mp3'},//couster
      {'icon': iconImage, 'title': 'Realiti by Grimes', 'file': 'ding/realiti.mp3'},
      {'icon': iconImage, 'title': 'Hoppípolla by Sigur Rós', 'file':'ding/hoppipolla.mp3'},//recos de personas <3
      {'icon': iconImage, 'title': 'Gun-Shy by Grizzly Bear', 'file':'ding/gun-shy.mp3'},//recos de personas <3
      {'icon': iconImage, 'title': 'lovely head by Goldfrapp', 'file':'ding/lovely-head.mp3'},//recos de personas <3
      {'icon': iconImage, 'title': 'Lorde - The Love Club', 'file':'ding/the-love-club.mp3'},//couster
      {'icon': iconImage, 'title': 'You & Me (Flume Remix) by MEUTE', 'file':'ding/you-and-me.mp3'},//recos de personas <3
      {'icon': iconImage, 'title': 'Stand Up by Hindi Zahra', 'file':'ding/stand-up.mp3'},//recos de personas <3
      {'icon': iconImage, 'title': 'My Kind Of Woman by MacDemarco', 'file':'ding/my-kind-of-woman.mp3'},//couster
      {'icon': iconImage, 'title': 'It´s Time To Wake Up 2023 by La Femme', 'file':'ding/its-time-to-wake-up-2023.mp3'},//couster
      {'icon': iconImage, 'title': 'Comme Si by Evergreen', 'file':'ding/comme-si.mp3'},//couster
      {'icon': iconImage, 'title': 'Autumn Sweater by Yo la Tengo', 'file':'ding/autumn-sweater.mp3'},//couster
      {'icon': iconImage, 'title': 'Nothing Matters When We´re Dancing by The Magnetic Fields', 'file':'ding/nothing-matters.mp3'},//couster
      {'icon': iconImage, 'title': 'East Harlem by Beirut', 'file':'ding/east-harlem.mp3'},//couster
      {'icon': iconImage, 'title': 'Love Like A Sunset by Phoenix', 'file':'ding/love-like-a-sunset.mp3'},//couster
      {'icon': iconImage, 'title': 'MS by Alt-J', 'file':'ding/ms.mp3'},//couster
      {'icon': iconImage, 'title': 'Just a Cloud by Lusine', 'file':'ding/just-a-cloud.mp3'},//couster
      {'icon': iconImage, 'title': 'Too Much by Sufjan Stevens', 'file':'ding/too-much.mp3'},//couster
      {'icon': iconImage, 'title': 'Close To Me by The Cure', 'file':'ding/close-to-me.mp3'},//couster
      {'icon': iconImage, 'title': 'Awful Sound (Oh Eurydice) by Arcade Fire', 'file':'ding/awful-sound-(oh-eurydice).mp3'},//couster
      {'icon': iconImage, 'title': 'Here Comes The Night Time II by Arcade Fire', 'file':'ding/here-comes-the-night-time-II.mp3'},//couster
      {'icon': iconImage, 'title': 'Dance Yrself Clean by LCD Soundsystem', 'file':'ding/dance-yrself-clean.mp3'},//couster
      {'icon': iconImage, 'title': 'By Your Side by Cocorosie', 'file':'ding/by-your-side.mp3'},//moluts
      {'icon': iconImage, 'title': 'Her Morning Elegance by Oren Lavie', 'file':'ding/her-morning-elegance.mp3'},//cian
      {'icon': iconImage, 'title': 'This Old Dog by Mac DeMarco', 'file':'ding/this-old-dog.mp3'},//couster
      {'icon': iconImage, 'title': 'Fever The Ghost by Source', 'file':'ding/source.mp3'},//annita
      {'icon': iconImage, 'title': 'Hunnybee by Unknown mortal Orchestra', 'file':'ding/hunnybee.mp3'},//couster
      {'icon': iconImage, 'title': 'Belle & Sebastian by Piazza, New York Catcher', 'file':'ding/piazza-new-york-catcher.mp3'},//couster
      {'icon': iconImage, 'title': 'Ben Folds - You Dont know me', 'file':'ding/you-dont-know-me.mp3'},//couster
      {'icon': iconImage, 'title': 'The Black Keys - Fever', 'file':'ding/fever.mp3'},//couster
      {'icon': iconImage, 'title': 'J-Boy by Phoenix', 'file':'ding/j-boy.mp3'},//couster
      {'icon': iconImage, 'title': 'Dancing Anymore by Is Tropical', 'file':'ding/dancing-anymore.mp3'},//Couster
      {'icon': iconImage, 'title': 'Awkward by San Cisco', 'file':'ding/awkward.mp3'},//couster
      {'icon': iconImage, 'title': 'Girls Just Want To Have Fun by STRFKR', 'file':'ding/girls-just-want-to-have-fun.mp3'},
      {'icon': iconImage, 'title': 'Infinite Content by Arcade Fire', 'file':'ding/infinite-content.mp3'},//couster
      {'icon': iconImage, 'title': 'Cooking Up Something Good by Mac DeMarco', 'file':'ding/cooking-up-something-good.mp3'},//couster
      {'icon': iconImage, 'title': 'Still Corners - The Trip', 'file':'ding/the-trip.mp3'},//cian
      {'icon': iconImage, 'title': 'Montanita by Ratatat', 'file':'ding/montanita.mp3'},//couster
      {'icon': iconImage, 'title': 'Ask Me Anything by The Strokes', 'file':'ding/ask-me-anything.mp3'},//couster
      {'icon': iconImage, 'title': 'Under Your Spell by Desire', 'file':'ding/under-your-spell.mp3'},
      {'icon': iconImage, 'title': 'My rollercoaster by Kimya Dawson', 'file':'ding/my-rollercoaster.mp3'},//couster
      {'icon': iconImage, 'title': 'Symphonia IX by Grimes', 'file':'ding/symphonia-ix.mp3'},//couster
      {'icon': iconImage, 'title': 'Everything Now by Arcade fire', 'file':'ding/everything-now.mp3'},//couster
      {'icon': iconImage, 'title': 'Spitfire - Public Service Broadcasting', 'file':'ding/spitfire.mp3'},//couster
      {'icon': iconImage, 'title': 'The Leanover by Life Without Buildings', 'file':'ding/the-leanover.mp3'},//Couster
      {'icon': iconImage, 'title': 'Ramblin´Man by Lemon Jelly', 'file':'ding/ramblin´-man.mp3'},//lus
      {'icon': iconImage, 'title': 'La Femme d´Argent by Air', 'file':'ding/la-femme-d-argent.mp3'},//couster
      {'icon': iconImage, 'title': 'Thinking Loudly by El Ten Eleven', 'file':'ding/thinking-loudly.mp3'},//couster
      {'icon': iconImage, 'title': 'Something For Your M.I.N.D (KEXP) by Superorganism', 'file':'ding/something-for-your-mind.mp3'},//couster
      {'icon': iconImage, 'title': 'Tarde Baby by Triomiau', 'file':'ding/tarde-baby.mp3'},//couster
      {'icon': iconImage, 'title': 'Septembre by La Femme', 'file':'ding/septembre.mp3'},//couster
      {'icon': iconImage, 'title': '(Interlude 2) by Alt-J', 'file':'ding/interlude-2.mp3'},//couster
      {'icon': iconImage, 'title': 'Lucky Number Nine by The Moldy Peaches', 'file':'ding/lucky-number-nine.mp3'},//couster
      {'icon': iconImage, 'title': 'Carmen Habanera by Georges Bizet', 'file':'ding/carmen-habanera.mp3'},//couster
      {'icon': iconImage, 'title': 'Tren de Aire Negro by La Gran Pérdida de Energía', 'file':'ding/tren-de-aire-negro.mp3'},//couster
      {'icon': iconImage, 'title': 'Hedonistic Me by Born Ruffians', 'file':'ding/hedonistic-me.mp3'},//Couster
      {'icon': iconImage, 'title': 'Taro by Alt-J', 'file':'ding/taro.mp3'},//couster
      {'icon': iconImage, 'title': 'What To Say by Born Ruffians', 'file':'ding/what-to-say.mp3'},//couster
      {'icon': iconImage, 'title': 'Everything Goes My Way by Metronomy', 'file':'ding/everything-goes-my-way.mp3'},//couster
      {'icon': iconImage, 'title': 'Verano by We Were Evergreen', 'file':'ding/verano.mp3'},//couster
      {'icon': iconImage, 'title': 'You Can Have It All by Yo La Tengo', 'file':'ding/you-can-have-it-all.mp3'},//Couster
      {'icon': iconImage, 'title': 'Seeds by Fog Lake', 'file':'ding/seeds.mp3'},//Couster
      {'icon': iconImage, 'title': 'Supersymmetry by Arcade Fire', 'file':'ding/supersymmetry.mp3'},//Couster
      {'icon': iconImage, 'title': 'The Moon Song by Karen O', 'file':'ding/the-moon-song.mp3'},//couster
      {'icon': iconImage, 'title': 'What´ll We Do by Someone Still Loves You Boris Yeltsin', 'file':'ding/what-ll-we-do.mp3'},//couster
      {'icon': iconImage, 'title': 'When I Was Done Dying by Dan Deacon', 'file':'ding/when-i-was-done-dying.mp3'},//couster
      {'icon': iconImage, 'title': 'Extraordinary Machine by Fiona Apple', 'file':'ding/extraordinary-machine.mp3'},//couster
      {'icon': iconImage, 'title': 'Put Your Money on Me by Arcade Fire', 'file':'ding/put-your-money-on-me.mp3'},//couster
      {'icon': iconImage, 'title': 'Ti Amo by Phoenix', 'file':'ding/ti-amo.mp3'},//couster
      {'icon': iconImage, 'title': 'Nepal by San Cisco', 'file':'ding/nepal.mp3'},//couster
      {'icon': iconImage, 'title': 'YR Broom by Someone Still Loves You Boris Yeltsin', 'file':'ding/yr-broom.mp3'},//couster
      {'icon': iconImage, 'title': 'Sorry About Your Irony by Ten Eleven', 'file':'ding/sorry-about-your-irony.mp3'},//couster, instrumental,
      {'icon': iconImage, 'title': 'Daylighting by Life Without Buildings', 'file':'ding/daylighting.mp3'},//couster, mañana
      {'icon': iconImage, 'title': 'The Look by Metronomy', 'file':'ding/the-look.mp3'},//couster
      {'icon': iconImage, 'title': 'Everlasting Light by The Black Keys', 'file':'ding/everlasting-light.mp3'},//couster
      {'icon': iconImage, 'title': 'Please Ask For Help by Telekinesis', 'file':'ding/please-ask-for-help.mp3'},//couster
      {'icon': iconImage, 'title': 'Drakkar Noir by Phoenix', 'file':'ding/drakkar-noir.mp3'},//Couster
      {'icon': iconImage, 'title': 'Hypocrite by Cage The Elephant', 'file':'ding/hypocrite.mp3'},//Couster
      {'icon': iconImage, 'title': 'Hands by Alpine', 'file':'ding/hands.mp3'},//Couster
      {'icon': iconImage, 'title': 'I Dare You by The XX', 'file':'ding/i-dare-you.mp3'},//Couster
      {'icon': iconImage, 'title': 'On Hold by The XX', 'file':'ding/on-hold.mp3'},//Couster
      {'icon': iconImage, 'title': 'Still Together (Live on KEXP) by Mac DeMarco', 'file':'ding/still-together.mp3'},//Couster
      {'icon': iconImage, 'title': 'Beach by San Cisco', 'file':'ding/beach.mp3'},//couster
      {'icon': iconImage, 'title': 'Nothing Gonna Hurt You Baby by Cigarettes After Sex', 'file':'ding/nothing-gonna-hurt-you-baby.mp3'},//Couster
      {'icon': iconImage, 'title': 'I Looked All over Town by The Magnetic Fields', 'file':'ding/i-looked-all-over-town.mp3'},//Couster
      {'icon': iconImage, 'title': 'Afterlife by Arcade Fire', 'file':'ding/afterlife.mp3'},//Couster
      {'icon': iconImage, 'title': 'Rising Up by Polock', 'file':'ding/rising-up.mp3'},//Couster
      {'icon': iconImage, 'title': 'Isabella of Castile by Starfucker', 'file':'ding/isabella-of-castile.mp3'},//Couster
      {'icon': iconImage, 'title': 'Love me Like You by The Magic Numbers', 'file':'ding/love-me-like-you.mp3'},//Couster
      {'icon': iconImage, 'title': 'Its All Over by The Broken Family Band', 'file':'ding/its-all-over.mp3'},//Couster
      {'icon': iconImage, 'title': 'Heads Up by Karen O & The Kids', 'file':'ding/heads-up.mp3'},//Couster
      {'icon': iconImage, 'title': 'Bye Bye Macadam by Rone', 'file':'ding/bye-bye-macadam.mp3'},//Couster
      {'icon': iconImage, 'title': 'In A Dream It Seemed Real by Islands', 'file':'ding/in-a-dream-it-seemed-real.mp3'},//Couster
      {'icon': iconImage, 'title': 'Release Me On The Floor by Figurines', 'file':'ding/release-me-on-the-floor.mp3'},//Couster
      {'icon': iconImage, 'title': 'Library by Julia Brown', 'file':'ding/library.mp3'},//Couster
      {'icon': iconImage, 'title': 'Anna by Will Butler', 'file':'ding/anna.mp3'},//Couster
      {'icon': iconImage, 'title': 'Electric Blue by Arcade Fire', 'file':'ding/electric-blue.mp3'},//Couster Will Butler
      {'icon': iconImage, 'title': 'The Magician by Andy Shauf', 'file':'ding/the-magician.mp3'},//Couster
      {'icon': iconImage, 'title': 'Salad Days by Mac DeMarco', 'file':'ding/salad-days.mp3'},//chino
      {'icon': iconImage, 'title': 'Dress Up In You by Belle And Sebastian', 'file':'ding/dress-up-in-you.mp3'},//couster
      {'icon': iconImage, 'title': 'Goodbye Weekend by Mac DeMarco', 'file':'ding/goodbye-weekend.mp3'},//chino
      {'icon': iconImage, 'title': 'Spring Has Sprung by Skegss', 'file':'ding/spring-has-sprung.mp3'},//ezequiel
      {'icon': iconImage, 'title': 'Heartbeat by The Knife', 'file':'ding/heartbeats.mp3'},//couster
      {'icon': iconImage, 'title': 'Forever Dumb by Surf Curse', 'file':'ding/forever-dumb.mp3'},//ezequiel
      {'icon': iconImage, 'title': 'Sur La Planche 2013 by La Femme', 'file':'ding/sur-la-planche-2013.mp3'},//couster
      {'icon': iconImage, 'title': 'Rawnald Gregory Erickson The Seco by STRFKR', 'file':'ding/rawnald-gregory-erickson-the-seco.mp3'},//couster
      {'icon': iconImage, 'title': 'Lasso by Phoenix', 'file':'ding/lasso.mp3'},
      {'icon': iconImage, 'title': 'Louise (My Girl Looks Like David Bowie) by Papooz', 'file':'ding/louise-my-girl-looks-like-david-bowie.mp3'},//couster, low-fi
      {'icon': iconImage, 'title': 'Quite Like You by Andy Shauf', 'file':'ding/quite-like-you.mp3'},//Nachisimo
      {'icon': iconImage, 'title': 'No man´s land by Sufjan Stevens', 'file':'ding/no-mans-land.mp3'},//cian
      {'icon': iconImage, 'title': 'Only For You by Heartless Bastards', 'file':'ding/only-for-you.mp3'},
      {'icon': iconImage, 'title': 'Honeymoon by Phoenix', 'file':'ding/honeymoon.mp3'},//couster
      {'icon': iconImage, 'title': 'Business As Usual by Coma Cinema', 'file':'ding/business-as-usual.mp3'},//couster
      {'icon': iconImage, 'title': 'Vintage Car by We Were Evergreen', 'file':'ding/vintage-car.mp3'},//couster
      {'icon': iconImage, 'title': 'Diane Young by Vampire Weekend', 'file': 'ding/diane-young.mp3'},//couster
      {'icon': iconImage, 'title': 'California by Grimes', 'file':'ding/california.mp3'},//couster
      {'icon': iconImage, 'title': 'Nous Étions Deux by La Femme', 'file':'ding/nous-étions-deux.mp3'},//couster
      {'icon': iconImage, 'title': 'Sophia by Good Shoes', 'file':'ding/sophia.mp3'},//couster
      {'icon': iconImage, 'title': 'Freak City by Polock', 'file': 'ding/freak-city.mp3'},//couster
      {'icon': iconImage, 'title': 'Lover Lover by Thieves like us', 'file':'ding/lover-lover.mp3'},//couster
      {'icon': iconImage, 'title': 'Burning by Whitest Boy Alive', 'file':'ding/burning.mp3'},//couster
      {'icon': iconImage, 'title': 'Heartbeat by The Knife', 'file':'ding/heartbeats.mp3'},//couster
      {'icon': iconImage, 'title': 'Interior Light by Young Rival', 'file':'ding/interior-light.mp3'},//couster
      {'icon': iconImage, 'title': 'I´m Not Gonna Teach Your Boyfriend by Black Kids ', 'file':'ding/im-not-gonna-teach-your-boyfriend.mp3'},//couster
      {'icon': iconImage, 'title': 'Waves by Electric Guest', 'file':'ding/waves.mp3'},
      {'icon': iconImage, 'title': 'Black & Blue by Miike Snow', 'file':'ding/black-y-blue.mp3'},
      {'icon': iconImage, 'title': 'The Uselessness of Hands by Nuculars Animals', 'file':'ding/the-uselessness-of-hands.mp3'},
      {'icon': iconImage, 'title': 'We The Common by Thao & The Get Down Stay Down', 'file':'ding/we-the-common.mp3'},
      {'icon': iconImage, 'title': 'Alleyway by Life in Film', 'file':'ding/alleyway.mp3'},
      {'icon': iconImage, 'title': 'You Go Running by Deep Sea Diver', 'file':'ding/you-go-running.mp3'},
      {'icon': iconImage, 'title': 'Modern Age by We Were Evergreen', 'file':'ding/modern-age.mp3'},
      {'icon': iconImage, 'title': 'Tuff Luff by The Unicorns', 'file':'ding/tuff-luff.mp3'},
      {'icon': iconImage, 'title': 'Such Great Heights by The Postal Service', 'file':'ding/such-great-heights.mp3'},
      {'icon': iconImage, 'title': 'California by Grimes', 'file':'ding/california.mp3'},
      {'icon': iconImage, 'title': 'Antitaxi by La Femme', 'file':'ding/antitaxi.mp3'},
      {'icon': iconImage, 'title': 'Deadbeat Summer by Neon Indian', 'file':'ding/deadbeat-summer.mp3'},
      {'icon': iconImage, 'title': 'Death To Los Campesinos! by Los Campesinos!', 'file':'ding/death-to-los-campesinos.mp3'},
      {'icon': iconImage, 'title': 'Boy Toy by STRFKR', 'file': 'ding/boy-toy.mp3'},
      {'icon': iconImage, 'title': 'Helping Handby Pollens', 'file': 'ding/helping-hand.mp3'},
      {'icon': iconImage, 'title': 'Villages by Alpine', 'file': 'ding/villages.mp3'},
      {'icon': iconImage, 'title': 'Skeleton Boy by Friendly Fires', 'file': 'ding/skeleton-boy.mp3'},
      {'icon': iconImage, 'title': 'Blue Eyes by Good Shoes', 'file': 'ding/blue-eyes.mp3'},
      {'icon': iconImage, 'title': 'Buffalo by The Phoenix Foundation', 'file': 'ding/buffalo.mp3'},
      {'icon': iconImage, 'title': 'Photobooth by Friendly Fires', 'file': 'ding/photobooth.mp3'},

  ]
});
