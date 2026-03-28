(function($) {

	var $window = $(window);
	var $body = $('body');
	var $nav = $('#nav');
	var $navLinks = $('#nav a');
	var $navToggle = $('.nav-toggle');
	var $preloader = $('#preloader');
	var $contactForm = $('#contact-form');
	var $cookieBanner = $('#cookie-banner');
	var slideIndex = 0;
	var slideTimer = null;
	var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
	var revealNodes = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
	var parallaxNodes = Array.prototype.slice.call(document.querySelectorAll('.parallax-section'));
	var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	breakpoints({
		xlarge: ['1281px', '1680px'],
		large: ['981px', '1280px'],
		medium: ['737px', '980px'],
		small: [null, '736px']
	});

	function updateNavState() {
		if ($window.scrollTop() > 24)
			$nav.addClass('is-scrolled');
		else
			$nav.removeClass('is-scrolled');
	}

	function closeMenu() {
		$nav.removeClass('is-open');
		$body.removeClass('menu-open');
	}

	function openMenu() {
		$nav.addClass('is-open');
		$body.addClass('menu-open');
	}

	function normalizePath(path) {
		if (!path || path === '/')
			return 'index.html';

		var cleanPath = path.split('/').pop();
		return cleanPath || 'index.html';
	}

	function setActiveNavLink() {
		var currentPage = normalizePath(window.location.pathname);
		var scrollPosition = window.scrollY + $nav.outerHeight() + 120;

		$navLinks.each(function() {
			var $link = $(this);
			var href = $link.attr('href') || '';
			var isAnchor = href.charAt(0) === '#';
			var isPageLink = !isAnchor && href.indexOf('.html') > -1;

			if (isPageLink) {
				$link.toggleClass('active', normalizePath(href) === currentPage);
				return;
			}

			if (!isAnchor) {
				$link.removeClass('active');
				return;
			}

			if (currentPage !== 'index.html') {
				$link.removeClass('active');
				return;
			}

			var target = document.querySelector(href);

			if (!target)
				return;

			var top = target.offsetTop;
			var bottom = top + target.offsetHeight;
			var isActive = scrollPosition >= top && scrollPosition < bottom;

			$link.toggleClass('active', isActive);
		});
	}

	function initScrolly() {
		$('#nav a[href^="#"], .scrolly[href^="#"]').scrolly({
			speed: 950,
			offset: function() { return $nav.outerHeight() - 6; }
		});
	}

	function goToSlide(index) {
		if (!slides.length)
			return;

		slideIndex = (index + slides.length) % slides.length;
		slides.forEach(function(slide, currentIndex) {
			slide.classList.toggle('is-active', currentIndex === slideIndex);
		});
	}

	function initHeroSlider() {
		if (prefersReducedMotion || slides.length < 2)
			return;

		goToSlide(0);
		slideTimer = window.setInterval(function() {
			goToSlide(slideIndex + 1);
		}, 5200);
	}

	function initReveal() {
		revealNodes.forEach(function(node) {
			var delay = node.getAttribute('data-delay');

			if (delay)
				node.style.setProperty('--delay', delay + 'ms');
		});

		if (prefersReducedMotion || !('IntersectionObserver' in window)) {
			revealNodes.forEach(function(node) {
				node.classList.add('is-visible');
			});
			return;
		}

		var observer = new IntersectionObserver(function(entries) {
			entries.forEach(function(entry) {
				if (!entry.isIntersecting)
					return;

				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			});
		}, {
			threshold: 0.18,
			rootMargin: '0px 0px -8% 0px'
		});

		revealNodes.forEach(function(node) {
			observer.observe(node);
		});
	}

	function updateParallax() {
		if (prefersReducedMotion)
			return;

		parallaxNodes.forEach(function(node) {
			var speed = parseFloat(node.getAttribute('data-parallax-speed')) || 0.12;
			var rect = node.getBoundingClientRect();
			var offset = (rect.top + rect.height * 0.5 - window.innerHeight * 0.5) * speed;
			node.style.setProperty('--parallax-offset', (-offset * 0.18) + 'px');
		});
	}

	function hidePreloader() {
		window.setTimeout(function() {
			$preloader.addClass('is-hidden');
			$body.removeClass('is-preload');
		}, 700);
	}

	function setFormStatus(type, message) {
		var $status = $('.form-status');

		if (!$status.length)
			return;

		$status.removeClass('is-error is-success is-loading');
		$status.addClass(type ? 'is-' + type : '');
		$status.text(message || '');
	}

	function initContactForm() {
		if (!$contactForm.length)
			return;

		$contactForm.on('submit', function(event) {
			event.preventDefault();

			var form = this;
			var formData = new FormData(form);
			var requiredFields = ['name', 'email', 'phone', 'subject', 'message'];
			var email = (formData.get('email') || '').trim();
			var hasError = requiredFields.some(function(field) {
				return !(formData.get(field) || '').trim();
			});

			if (hasError) {
				setFormStatus('error', 'Preencha todos os campos obrigatorios para continuar.');
				return;
			}

			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				setFormStatus('error', 'Informe um e-mail valido para receber o retorno da equipe.');
				return;
			}

			setFormStatus('loading', 'Enviando sua mensagem...');

			fetch(form.getAttribute('action') || 'contact-handler.php', {
				method: 'POST',
				body: formData,
				headers: {
					'X-Requested-With': 'XMLHttpRequest'
				}
			})
			.then(function(response) {
				return response.json();
			})
			.then(function(data) {
				if (!data.success)
					throw new Error(data.message || 'Nao foi possivel enviar sua mensagem.');

				form.reset();
				setFormStatus('success', data.message || 'Mensagem enviada com sucesso.');
			})
			.catch(function(error) {
				setFormStatus('error', error.message || 'Ocorreu um erro ao enviar. Tente novamente.');
			});
		});
	}

	function initCookieBanner() {
		if (!$cookieBanner.length)
			return;

		var cookieChoice = window.localStorage.getItem('fivnet-cookie-consent');

		if (!cookieChoice)
			window.setTimeout(function() {
				$cookieBanner.addClass('is-visible');
			}, 900);

		$cookieBanner.find('.cookie-btn').on('click', function() {
			var choice = $(this).data('cookie-action');
			window.localStorage.setItem('fivnet-cookie-consent', choice);
			$cookieBanner.removeClass('is-visible');
		});
	}

	$window.on('load', function() {
		updateNavState();
		setActiveNavLink();
		updateParallax();
		hidePreloader();
	});

	$window.on('scroll', function() {
		updateNavState();
		setActiveNavLink();
		updateParallax();
	});

	$window.on('resize', function() {
		updateNavState();
		setActiveNavLink();

		if (window.innerWidth > 980)
			closeMenu();
	});

	$navToggle.on('click', function() {
		if ($nav.hasClass('is-open'))
			closeMenu();
		else
			openMenu();
	});

	$navLinks.on('click', function() {
		closeMenu();
	});

	initScrolly();
	initHeroSlider();
	initReveal();
	initContactForm();
	initCookieBanner();
	updateNavState();
	setActiveNavLink();
	updateParallax();

})(jQuery);
