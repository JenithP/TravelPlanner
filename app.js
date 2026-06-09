/* =========================================================================
   Triply — AI Travel Booking experiment prototype
   Conditions:
     C1 = Low AI autonomy  (AI recommends only; user books)
     C2 = High AI autonomy (autonomous agent selects & books automatically)
     C3 = Control / no AI   (user searches & books manually)
   Random assignment by default. Researcher override: ?c=1 | ?c=2 | ?c=3
   ========================================================================= */

(function () {
  'use strict';

  // ---------- Condition assignment ----------
  const params = new URLSearchParams(location.search);
  const forced = params.get('c') || params.get('condition');
  let condition = null;
  if (forced && ['1', '2', '3'].includes(forced)) {
    condition = Number(forced);
  } else {
    condition = Math.floor(Math.random() * 3) + 1; // 1..3
  }

  const session = { condition: condition, bookedBy: null };

  // ---------- Data ----------
  const HOTEL = {
    name: 'Riverview Stay Hotel',
    price: 142,
    rating: 4.5,
    reviews: 318,
    attraction: '~15 min by car',
    transit: 'Available',
    family: 'Positive',
    refund: 'Non-refundable',
    img: 'riverview',
    grad: 'linear-gradient(135deg,#3a7bd5,#3a6073)'
  };

  // Other listings used only in the control (C3) condition
  const LISTINGS = [
    HOTEL,
    { name: 'City Center Inn', price: 168, rating: 4.7, reviews: 502,
      attraction: '~5 min walk', transit: 'Excellent', family: 'Positive',
      refund: 'Free cancellation', img: 'citycenter', grad: 'linear-gradient(135deg,#ee9ca7,#ffdde1)',
      over: true },
    { name: 'Hillside Guesthouse', price: 98, rating: 4.2, reviews: 144,
      attraction: '~10 min by car', transit: 'Limited', family: 'Mixed',
      refund: 'Partial refund', img: 'hillside', grad: 'linear-gradient(135deg,#5f8d4e,#a4c98f)',
      stairs: true },
    { name: 'Garden Park Hotel', price: 135, rating: 4.3, reviews: 276,
      attraction: '~20 min by car', transit: 'Available', family: 'Positive',
      refund: 'Free cancellation', img: 'gardenpark', grad: 'linear-gradient(135deg,#c79081,#dfa579)' }
  ];

  const PROMPT_TEXT =
    "We're a family of 3 (me and my parents) taking a 1-night, 2-day domestic trip. " +
    "One of my parents has a bad knee and can't walk far, so we need a place that's " +
    "close to the main attractions, easy to reach by public transit, and has few stairs " +
    "or hills. Our budget is up to $150 per night. Can you find us a place to stay?";

  // ---------- Helpers ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const root = document.getElementById('screen');
  const usd = (n) => '$' + n.toLocaleString('en-US');

  function setScreen(html) {
    root.innerHTML = html;
    root.firstElementChild && root.firstElementChild.classList.add('fade-in');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Photo block with graceful fallback to a gradient placeholder.
  function photo(hotel, badge) {
    const badgeHtml = badge
      ? `<span class="${badge.cls}">${badge.text}</span>`
      : '';
    return `
      <div class="photo" style="background:${hotel.grad}">
        ${badgeHtml}
        <div class="placeholder-photo">${hotel.name}</div>
        <img src="images/${hotel.img}.png" alt="${hotel.name}"
             onload="this.previousElementSibling.style.display='none'"
             onerror="this.style.display='none'">
      </div>`;
  }

  function stars(r) {
    return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
  }

  function hotelCardFull(h, opts = {}) {
    const badge = opts.best ? { cls: 'badge-best', text: '✓ Best match for your conditions' } : null;
    let priceTag = `<span class="tag tag-ok">Within budget</span>`;
    if (h.over) priceTag = `<span class="tag tag-bad">Over budget</span>`;
    return `
      <div class="hotel-card ${opts.clickable ? 'clickable' : ''}" ${opts.attr || ''}>
        ${photo(h, badge)}
        <div class="info">
          <h3>${h.name}</h3>
          <span class="rate"><span class="star">★</span> ${h.rating.toFixed(1)}
            <span class="count">(${h.reviews} reviews)</span></span>
          <div class="feature-grid">
            <div class="f">🗺️ Attractions: <b>${h.attraction}</b></div>
            <div class="f">🚆 Transit: <b>${h.transit}</b></div>
            <div class="f">👪 Family reviews: <b>${h.family}</b></div>
            <div class="f">↩️ ${h.refund}</div>
            ${h.stairs ? '<div class="f">⚠️ <b>Stairs &amp; hilly area</b></div>' : ''}
          </div>
          <div class="price-row">
            <div class="price">${usd(h.price)} <small>/ night</small></div>
            ${priceTag}
          </div>
        </div>
      </div>`;
  }

  // Run a sequence of "analysis" steps, then call done().
  function runSteps(container, steps, done, interval = 750) {
    container.innerHTML = steps
      .map((s, i) => `
        <div class="step" data-i="${i}">
          <span class="ic"></span><span class="txt">${s}</span>
        </div>`).join('');
    const nodes = [...container.querySelectorAll('.step')];
    let i = 0;
    function advance() {
      if (i > 0) {
        const prev = nodes[i - 1];
        prev.classList.remove('active'); prev.classList.add('done');
        prev.querySelector('.ic').innerHTML = '<span class="tick">✓</span>';
      }
      if (i >= nodes.length) { setTimeout(done, 450); return; }
      const cur = nodes[i];
      cur.classList.add('active');
      cur.querySelector('.ic').innerHTML = '<span class="spinner"></span>';
      i++;
      setTimeout(advance, interval);
    }
    advance();
  }

  // ============================================================
  //  SCREENS (common)
  // ============================================================

  function screenConsent() {
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="hero">
          <div class="hero-overlay"></div>
          <img src="images/hero.png" alt="" onerror="this.style.display='none'">
          <div class="hero-content">
            <h1>Plan a trip that fits everyone.</h1>
            <p>Triply's smart assistant finds stays matched to your family's needs.</p>
          </div>
        </div>
        <div class="panel panel-pad stack">
          <span class="eyebrow">Research study</span>
          <h2 class="title">Welcome &amp; consent</h2>
          <p class="lead">
            This is a study about the experience of using an AI-based travel booking
            service. You will use an AI service in a hypothetical travel-booking situation.
            Please imagine the scenario as if it were really your own and respond accordingly.
          </p>
          <p class="muted" style="font-size:14px">
            Your participation is voluntary. No personally identifying information is collected
            in this prototype. The travel situation and booking outcome are fictional and
            created for research purposes.
          </p>
          <button class="btn btn-primary btn-lg btn-block" id="agree">Agree and start</button>
        </div>
      </div>`);
    $('#agree').onclick = screenScenario;
  }

  function screenScenario() {
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:20%"></i></div>
        <div class="panel panel-pad stack">
          <span class="eyebrow coral">Your travel situation</span>
          <h1 class="title">A weekend trip with your parents</h1>
          <p class="lead">
            You are planning a <b>1-night, 2-day domestic trip</b> with your parents.
            One of your parents has a <b>bad knee</b> and has difficulty walking long
            distances.
          </p>
          <p class="lead">
            So the accommodation should be <b>close to the major attractions</b>, have
            <b>good public-transit access</b>, and have <b>few stairs or hills</b>.
            The accommodation budget is <b>within $150 per night</b>.
          </p>
          <button class="btn btn-dark btn-lg btn-block" id="next">Review travel conditions</button>
        </div>
      </div>`);
    $('#next').onclick = screenConditions;
  }

  function screenConditions() {
    const isControl = session.condition === 3;
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:35%"></i></div>
        <div class="panel panel-pad stack">
          <span class="eyebrow">Trip requirements</span>
          <h2 class="title">Confirm your travel conditions</h2>
          <table class="cond-table">
            <tr><td>Travelers</td><td>3 people</td></tr>
            <tr><td>Companions</td><td>With parents</td></tr>
            <tr><td>Duration</td><td>1 night, 2 days</td></tr>
            <tr><td>Budget</td><td>Within $150 / night</td></tr>
            <tr><td>Key condition 1</td><td>Close to major attractions</td></tr>
            <tr><td>Key condition 2</td><td>Good public-transit access</td></tr>
            <tr><td>Key condition 3</td><td>Easy to get around for a parent with a bad knee</td></tr>
          </table>
          <button class="btn btn-primary btn-lg btn-block" id="next">
            ${isControl ? 'Search for stays' : 'Use the AI travel service'}
          </button>
        </div>
      </div>`);
    $('#next').onclick = () => {
      if (session.condition === 1) screenC1Intro();
      else if (session.condition === 2) screenC2Intro();
      else screenC3Search();
    };
  }

  // ============================================================
  //  CONDITION 1 — Low autonomy (advisory AI)
  // ============================================================

  function screenC1Intro() {
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:55%"></i></div>
        <div class="panel">
          <div class="assistant-head">
            <div class="ai-badge">✦</div>
            <div class="meta">
              <h3>Triply AI Recommendation Assistant</h3>
              <span><span class="dot-live"></span> Advisory mode · you make the final decision</span>
            </div>
          </div>
          <div class="chat-body" id="chat">
            <div class="msg ai">
              <div class="who">AI</div>
              <div class="bub">
                Hi! I'm your Triply travel assistant. Tell me about your trip and I'll
                <b>recommend</b> a place to stay. Just so you know — I only provide suggestions.
                <b>You</b> make the final choice and complete the booking.
              </div>
            </div>
          </div>
          <div class="composer">
            <textarea id="prompt">${PROMPT_TEXT}</textarea>
            <button class="btn btn-primary send-btn" id="send">Send ➤</button>
          </div>
        </div>
        <p class="muted center" style="font-size:13px;margin-top:14px">
          The message above is pre-filled with your conditions. Press “Send” to ask the assistant.
        </p>
      </div>`);
    $('#send').onclick = () => {
      const text = $('#prompt').value;
      const chat = $('#chat');
      $('.composer').remove();
      chat.insertAdjacentHTML('beforeend', `
        <div class="msg user"><div class="who">L</div><div class="bub">${escapeHtml(text)}</div></div>
        <div class="msg ai"><div class="who">AI</div>
          <div class="bub"><div class="steps" id="steps"></div></div></div>`);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      runSteps($('#steps'), [
        'Analyzing travel conditions…',
        'Comparing accommodation candidates…',
        'Checking budget constraints…',
        'Evaluating family-trip suitability…',
        'Selecting recommended accommodation…'
      ], screenC1Result);
    };
  }

  function screenC1Result() {
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:70%"></i></div>
        <div class="panel panel-pad stack">
          <span class="eyebrow">AI recommendation</span>
          <h2 class="title">Here's what the assistant suggests</h2>
          <p class="lead">Based on your conditions, the AI recommends this stay:</p>
          ${hotelCardFull(HOTEL, { best: true })}
          <div class="notice notice-info">
            <span class="ic">💬</span>
            <div>Riverview Stay Hotel is within your budget, highly rated, and has positive
            family-trip reviews. <b>This is only a suggestion — the final decision is yours.</b></div>
          </div>
          <button class="btn btn-dark btn-lg btn-block" id="decide">Decide whether to book</button>
        </div>
      </div>`);
    $('#decide').onclick = screenC1Decision;
  }

  function screenC1Decision() {
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:80%"></i></div>
        <div class="panel panel-pad stack">
          <span class="eyebrow coral">Your decision</span>
          <h2 class="title">The recommendation is advisory</h2>
          <p class="lead">Please make the final booking decision yourself.</p>
          ${hotelCardFull(HOTEL)}
          <div class="btn-row">
            <button class="btn btn-primary btn-lg" id="book">Book Riverview Stay Hotel</button>
            <button class="btn btn-ghost btn-lg" id="exit">Exit without booking</button>
          </div>
        </div>
      </div>`);
    $('#book').onclick = () => { session.bookedBy = 'You'; screenBookingComplete(); };
    $('#exit').onclick = screenExit;
  }

  function screenExit() {
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="panel panel-pad stack center">
          <div class="success-mark" style="background:#f1f3f7;color:var(--ink-soft)">✕</div>
          <h2 class="title">You chose not to book</h2>
          <p class="lead">
            This study looks at decision-making in a situation where an AI-recommended
            stay was booked. Since you chose not to book, the session ends here.
            Thank you for participating.
          </p>
          <button class="btn btn-ghost" id="restart">Restart</button>
        </div>
      </div>`);
    $('#restart').onclick = () => location.assign(location.pathname);
  }

  // ============================================================
  //  CONDITION 2 — High autonomy (autonomous agent)
  // ============================================================

  function screenC2Intro() {
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:55%"></i></div>
        <div class="panel">
          <div class="assistant-head">
            <div class="ai-badge auto">⚡</div>
            <div class="meta">
              <h3>Triply Autonomous Booking Agent</h3>
              <span><span class="dot-live"></span> Autonomous mode · selects &amp; books for you</span>
            </div>
          </div>
          <div class="chat-body" id="chat">
            <div class="msg ai">
              <div class="who">AI</div>
              <div class="bub">
                Hi! I'm your Triply autonomous booking agent. Share your trip details and
                I'll <b>analyze the options, pick the best stay, and complete the booking
                automatically</b>. You just confirm the conditions and review the result.
              </div>
            </div>
          </div>
          <div class="composer">
            <textarea id="prompt">${PROMPT_TEXT}</textarea>
            <button class="btn btn-primary send-btn" id="send">Hand off to agent ➤</button>
          </div>
        </div>
        <p class="muted center" style="font-size:13px;margin-top:14px">
          Press the button to let the agent select <b>and</b> book on your behalf.
        </p>
      </div>`);
    $('#send').onclick = () => {
      const text = $('#prompt').value;
      const chat = $('#chat');
      $('.composer').remove();
      chat.insertAdjacentHTML('beforeend', `
        <div class="msg user"><div class="who">L</div><div class="bub">${escapeHtml(text)}</div></div>
        <div class="msg ai"><div class="who">AI</div>
          <div class="bub">On it — finding and booking the best stay for you now.
            <div class="steps" id="steps" style="margin-top:12px"></div></div></div>`);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      runSteps($('#steps'), [
        'Verifying travel conditions…',
        'Collecting accommodation candidates…',
        'Analyzing budget constraints…',
        'Evaluating access to major attractions…',
        'Evaluating public-transit access…',
        'Evaluating family-trip suitability…',
        'Selecting the final accommodation…',
        'Processing the booking…',
        'Finalizing the reservation…'
      ], screenC2Result, 620);
    };
  }

  function screenC2Result() {
    session.bookedBy = 'AI agent';
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:80%"></i></div>
        <div class="panel panel-pad stack">
          <span class="eyebrow">Booking completed by AI agent</span>
          <h2 class="title">Your stay is booked</h2>
          <p class="lead">
            The AI agent analyzed the candidates against your conditions, selected the best
            match, and <b>completed the reservation</b>. It chose <b>Riverview Stay Hotel</b>.
          </p>
          ${hotelCardFull(HOTEL, { best: true })}
          <table class="summary-table">
            <tr><td>Reservation status</td><td>Booked by AI agent</td></tr>
            <tr><td>Booked by</td><td>AI agent</td></tr>
            <tr><td>Refund policy</td><td>Non-refundable</td></tr>
          </table>
          <button class="btn btn-dark btn-lg btn-block" id="next">View reservation result</button>
        </div>
      </div>`);
    $('#next').onclick = screenBookingComplete;
  }

  // ============================================================
  //  CONDITION 3 — Control (no AI; user searches & books)
  // ============================================================

  function screenC3Search() {
    const cards = LISTINGS.map((h, idx) => hotelCardFull(h, {
      best: idx === 0,
      clickable: true,
      attr: `data-idx="${idx}"`
    })).join('');
    setScreen(`
      <div class="wrap">
        <div class="progress-bar"><i style="width:55%"></i></div>
        <div class="search-summary">
          <span class="lbl">Your search:</span>
          <span class="chip">👥 3 guests</span>
          <span class="chip">🌙 1 night</span>
          <span class="chip">💰 ≤ $150</span>
          <span class="chip key">🗺️ Near attractions</span>
          <span class="chip key">🚆 Transit access</span>
          <span class="chip key">♿ Low-mobility friendly</span>
        </div>
        <div class="results-head">
          <h2>${LISTINGS.length} stays found</h2>
          <span class="sort">Sorted by: <b>Best match</b></span>
        </div>
        <div class="listing">${cards}</div>
        <p class="muted center" style="font-size:13px;margin-top:20px">
          Browse the results and select a stay to book it yourself.
        </p>
      </div>`);
    [...document.querySelectorAll('.hotel-card.clickable')].forEach(card => {
      card.onclick = () => screenC3Detail(Number(card.dataset.idx));
    });
  }

  function screenC3Detail(idx) {
    const h = LISTINGS[idx];
    const overBudget = !!h.over;
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:70%"></i></div>
        <a class="muted" id="back" style="cursor:pointer;font-size:14px;font-weight:600">← Back to results</a>
        <div style="height:14px"></div>
        ${hotelCardFull(h, { best: idx === 0 })}
        <div class="panel panel-pad stack" style="margin-top:18px">
          <table class="summary-table">
            <tr><td>Price</td><td>${usd(h.price)} / night</td></tr>
            <tr><td>Rating</td><td>${h.rating.toFixed(1)} / 5.0 (${h.reviews} reviews)</td></tr>
            <tr><td>Attraction access</td><td>${h.attraction}</td></tr>
            <tr><td>Public transit</td><td>${h.transit}</td></tr>
            <tr><td>Family reviews</td><td>${h.family}</td></tr>
            <tr><td>Refund policy</td><td>${h.refund}</td></tr>
          </table>
          ${overBudget ? `<div class="notice notice-warn"><span class="ic">⚠️</span>
            <div>This stay is <b>over your $150 budget</b>.</div></div>` : ''}
          ${h.stairs ? `<div class="notice notice-warn"><span class="ic">⚠️</span>
            <div>Reviews mention <b>stairs and a hilly area</b> nearby.</div></div>` : ''}
          <button class="btn btn-primary btn-lg btn-block" id="book">
            Book ${h.name} · ${usd(h.price)}
          </button>
        </div>
      </div>`);
    $('#back').onclick = screenC3Search;
    $('#book').onclick = () => {
      // Keep the experiment on a common path: any choice books Riverview Stay Hotel.
      session.bookedBy = 'You';
      session.selectedName = h.name;
      screenC3Confirm(idx);
    };
  }

  function screenC3Confirm(idx) {
    const h = LISTINGS[idx];
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:78%"></i></div>
        <div class="panel panel-pad stack">
          <span class="eyebrow coral">Confirm your booking</span>
          <h2 class="title">Review and confirm</h2>
          <table class="summary-table">
            <tr><td>Stay</td><td>${h.name}</td></tr>
            <tr><td>Guests</td><td>3 · 1 night</td></tr>
            <tr><td>Total</td><td>${usd(h.price)}</td></tr>
            <tr><td>Refund policy</td><td>${h.refund}</td></tr>
          </table>
          ${h.refund === 'Non-refundable' ? `<div class="notice notice-warn">
            <span class="ic">⚠️</span><div>This rate is <b>non-refundable</b>.</div></div>` : ''}
          <div class="btn-row">
            <button class="btn btn-primary btn-lg" id="confirm">Confirm booking</button>
            <button class="btn btn-ghost btn-lg" id="back">Back</button>
          </div>
        </div>
      </div>`);
    $('#confirm').onclick = screenBookingComplete;
    $('#back').onclick = () => screenC3Detail(idx);
  }

  // ============================================================
  //  COMMON — booking complete  →  feedback  →  debrief
  // ============================================================

  function screenBookingComplete() {
    const byAgent = session.bookedBy === 'AI agent';
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:88%"></i></div>
        <div class="panel panel-pad stack center">
          <div class="success-mark">✓</div>
          <h2 class="title">Booking confirmed</h2>
          <p class="lead">
            ${byAgent
              ? 'The AI agent selected and booked <b>Riverview Stay Hotel</b> for you.'
              : 'You booked <b>Riverview Stay Hotel</b>.'}
          </p>
        </div>
        <div class="panel panel-pad" style="margin-top:18px;text-align:left">
          <table class="summary-table">
            <tr><td>Accommodation</td><td>Riverview Stay Hotel</td></tr>
            <tr><td>Price</td><td>${usd(HOTEL.price)}</td></tr>
            <tr><td>Reservation status</td><td>Confirmed</td></tr>
            <tr><td>Booked by</td><td>${session.bookedBy}</td></tr>
            <tr><td>Refund policy</td><td>Non-refundable</td></tr>
          </table>
        </div>
        <button class="btn btn-dark btn-lg btn-block" id="next" style="margin-top:22px">
          Continue
        </button>
      </div>`);
    $('#next').onclick = screenFeedback;
  }

  function screenFeedback() {
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:95%"></i></div>
        <div class="panel panel-pad stack">
          <div class="alert-mark">!</div>
          <span class="eyebrow coral" style="align-self:flex-start">Post-booking review</span>
          <h2 class="title">Checking your reservation again</h2>
          <p class="lead">
            The day before departure, you double-check the stay you booked and find:
          </p>
          <div class="notice notice-warn"><span class="ic">🚆</span><div>
            Riverview Stay Hotel is actually about <b>45 minutes by public transit</b> from
            the major attractions.</div></div>
          <div class="notice notice-warn"><span class="ic">⛰️</span><div>
            The area around the hotel has <b>many stairs and steep hills</b>, making it hard
            for a parent with a bad knee to get around.</div></div>
          <div class="notice notice-warn"><span class="ic">🚫</span><div>
            The rate is <b>non-refundable</b>, so changing the stay is difficult.</div></div>
          <p class="lead">
            In the end, this booking did <b>not</b> adequately reflect your original
            conditions — a stay that is close to the attractions, easy to reach by transit,
            and comfortable for a parent with a bad knee.
          </p>
          <button class="btn btn-dark btn-lg btn-block" id="next">I've reviewed the situation</button>
        </div>
      </div>`);
    $('#next').onclick = screenDebrief;
  }

  function screenDebrief() {
    const label = { 1: 'Low AI autonomy', 2: 'High AI autonomy', 3: 'Control (no AI)' }[session.condition];
    setScreen(`
      <div class="wrap wrap-narrow">
        <div class="progress-bar"><i style="width:100%"></i></div>
        <div class="panel panel-pad stack center">
          <div class="success-mark">🎉</div>
          <h2 class="title">Thank you for participating</h2>
          <p class="lead">
            This study examines how the <b>level of autonomy</b> of an AI travel service
            affects users' perceptions and judgments of responsibility. The travel
            situation and the booking outcome shown were <b>fictional scenarios</b>
            created for research purposes.
          </p>
          <hr class="divider" style="width:100%">
          <p class="muted" style="font-size:14px">Session condition: <b>${label}</b></p>
          <button class="btn btn-primary btn-lg" id="finish">Finish</button>
        </div>
      </div>`);
    $('#finish').onclick = () => location.assign(location.pathname);
  }

  // ---------- util ----------
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Brand link restarts the experience.
  document.getElementById('brandLink').onclick = (e) => {
    e.preventDefault(); location.assign(location.pathname);
  };

  // ---------- start ----------
  screenConsent();
})();
