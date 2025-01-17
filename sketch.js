function random_choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class App {
  constructor() {
    this.NUMPIGS = 2;
    this.WINNING_SCORE = 100;

    document.getElementById("ok-boomer").style.display = "inline";
    document.getElementById("main-screen").style.display = "none";
    document.getElementById("gameover-screen").style.display = "none";
    document.getElementById("title-screen").style.display = "block";
    document.getElementById("pigpen").innerHTML = "";

    this.STATES = [
      PigOutState,
      SiderState,
      TrotterState,
      DoubleTrotterState,
      RazorbackState,
      DoubleRazorbackState,
      SnouterState,
      DoubleSnouterState,
      LeaningJowlerState,
      DoubleLeaningJowlerState,
      MixedComboState,
    ];

    for (let i in this.STATES) {
      this.STATES[i] = new this.STATES[i](this);
    }
  }

  game_over() {
    if (this.active_player.constructor != God) {
      document.getElementById("ok-boomer").style.display = "none";
      if (
        !this.players
          .map((player) => {
            return player.constructor;
          })
          .includes(God)
      ) {
        document.getElementById(
          "win-lose-label"
        ).innerHTML = `${this.active_player.name} wins!`;
      } else {
        document.getElementById(
          "win-lose-label"
        ).innerHTML = `How on earth did you just do that? (that was supposed to be impossible)`;
      }
    }

    document.getElementById("main-screen").style.display = "none";
    document.getElementById("gameover-screen").style.display = "block";
  }

  start_round(players) {
    this.rolling = false;
    this.first_roll = true;
    this.ai_rolling = false;

    this.NUMPLAYERS = players;

    this.players = [];
    this.playerID = 0;
    for (var i = 0; i < this.NUMPLAYERS; i++) {
      this.players.push(new Player(i));
    }

    if (players == 1) {
      let opponent;
      if (Math.random() <= 0.2) {
        opponent = God;
      } else {
        opponent = Robot;
      }
      this.players.push(new opponent(this, this.players.length));
    }

    this.active_player = this.players[this.playerID];

    this.scoreboard = new Scoreboard(this);

    this.create_pigs();

    document.getElementById("title-screen").style.display = "none";
    document.getElementById("main-screen").style.display = "block";

    this.update_player_label();

    this.active_player.on_turn();
  }

  create_pigs() {
    this.pigs = [];
    for (let i = 0; i < this.NUMPIGS; i++) {
      this.pigs.push(new Pig(this));
    }
  }

  pass(ai = false) {
    if (this.rolling) {
      return;
    }
    if (this.first_roll) {
      return;
    }
    if (this.ai_rolling && !ai) {
      return;
    }

    this.active_player.on_pass();

    this.first_roll = true;

    this.playerID++;
    this.playerID = this.playerID % this.players.length;

    this.active_player.score += this.active_player.score_this_turn;
    this.active_player.score_this_turn = 0;

    this.active_player = this.players[this.playerID];

    this.active_player.on_turn();

    this.update_player_label();
    this.scoreboard.update_element();
  }

  update_player_label() {
    document.getElementById("player-label").innerHTML = `Player ${
      this.playerID + 1
    }`;
  }

  check_state() {
    for (let i in this.STATES) {
      if (this.STATES[i].check()) {
        this.STATES[i].trigger();
        this.scoreboard.update_element();
        return;
      }
    }
    console.error("Nothing happened!");
  }

  check_done_rolling() {
    for (let i in this.pigs) {
      if (this.pigs[i].rolling) {
        return;
      }
    }
    this.rolling = false;
    this.check_state();

    if (
      this.active_player.score + this.active_player.score_this_turn >=
      this.WINNING_SCORE
    ) {
      this.game_over();
      return;
    }

    this.active_player.on_turn();
  }

  roll(ai = false) {
    if (this.rolling) {
      return;
    }
    if (this.ai_rolling && !ai) {
      return;
    }
    this.first_roll = false;
    this.rolling = true;
    for (var n in this.pigs) {
      this.pigs[n].roll();
    }
  }
}

class Scoreboard {
  constructor(app) {
    this.app = app;
    this.get_element();
    this.update_element();
  }

  get_element() {
    this.element = document.getElementById("scoreboard");
  }

  compile_entry(player) {
    let player_name = player.name;
    let player_score = player.score;

    if (this.app.playerID == player.ID) {
      player_name = `<b>${player_name}</b>`;
      player_score = `${player_score} <i><b>+ ${player.score_this_turn}</b></i>`;
    }

    player_name = `<div class="player-name">${player_name}</div>`;

    player_score = `<div class="player-score">${player_score}</div>`;

    return `<div class="scoreboard-entry">${player_name}${player_score}</div>`;
  }

  update_element() {
    let html = "";
    for (let i in this.app.players) {
      html += this.compile_entry(this.app.players[i]);
    }

    this.element.innerHTML = html;
  }
}

class Player {
  constructor(id) {
    this.score = 0;
    this.score_this_turn = 0;
    this.ID = id;
    this.name = `Player ${this.ID + 1}`;
  }

  on_pass() {}

  on_turn() {}
}

class PigLabel {
  constructor(element) {
    this.element = element;
    this.obfiscated = false;
    this.msg = "";
  }

  obfiscate(msg) {
    this.msg = msg;
    this.obfiscated = true;
    this._obfis();
  }

  deobfiscate() {
    this.obfiscated = false;
  }

  junk_text(len) {
    let r = "";
    const chars = "|-";
    for (let n = 0; n < len; n++) {
      r += random_choice(chars);
    }
    return r;
  }

  _obfis() {
    if (!this.obfiscated) {
      this.element.innerHTML = this.msg;
      return;
    }
    this.element.innerHTML = this.junk_text(20);
    setTimeout(() => {
      this._obfis();
    }, 100);
  }
}

class PigRepresentation {
  constructor(pig) {
    this.pig = pig;

    this.create_objects();
  }

  roll(state) {
    this.animate(state.anim, state.timing);
    this.label.obfiscate(state.NAME);
  }

  animate(anim, timing) {
    this.obj.animate(anim, timing);
  }

  finish_roll() {
    this.label.deobfiscate();
  }

  create_objects() {
    const pen = document.getElementById("pigpen");
    const template = document.getElementById("samplePig");

    let objs = [];
    let obj;

    for (var childId = 0; childId < template.children.length; childId++) {
      obj = template.children[childId].cloneNode(true);
      pen.appendChild(obj);
      objs.push(obj);
    }

    this.obj = objs[0];
    this.label = new PigLabel(objs[1]);
  }
}

class Pig {
  constructor(app) {
    this.app = app;

    this.rolling = false;

    this.states = [
      PigOnFront,
      PigOnBack,
      PigOnNose,
      PigOnRight,
      PigOnLeft,
      TiltedPig,
    ];

    for (var n in this.states) {
      this.states[n] = new this.states[n](this.app);
    }

    this.representation = new PigRepresentation(this);
  }

  finish_roll() {
    this.rolling = false;
    this.representation.finish_roll();
    this.app.check_done_rolling();
  }

  compute_roll() {
    let prev = 0;
    const rand = Math.random();
    for (let i in this.states) {
      if ((this.states[i].CHANCE + prev) / 100 >= rand) {
        return this.states[i];
      }
      prev += this.states[i].CHANCE;
    }
  }

  roll() {
    this.rolling = true;

    this.state = this.compute_roll();

    this.representation.roll(this.state);

    setTimeout(() => {
      this.finish_roll();
    }, this.state.DURATION);
  }
}

class PigState {
  constructor(app) {
    this.app = app;

    this._init();
    this.init();

    this._comple_anims();
  }

  _init() {
    this.NAME = ":P (ha ha)";
    this.SPIN_COUNT = 5;
    this.END_DEG = 0;
    this.CHANCE = -1;
    this.EASING = "ease-in-out";
    this.DURATION = 2500;
  }

  init() {
    console.error(`${this} needs an init() function`);
  }

  _comple_anim() {
    return [
      { transform: `rotate(0deg)` },
      { transform: `rotate(${360 * this.SPIN_COUNT - this.END_DEG}deg)` },
    ];
  }

  _compile_timing() {
    return {
      duration: this.DURATION,
      iterations: 1,
      easing: this.EASING,
      fill: "forwards",
    };
  }

  _comple_anims() {
    this.anim = this._comple_anim();
    this.timing = this._compile_timing();
  }
}

class PigOnBack extends PigState {
  init() {
    this.NAME = "Razorback";
    this.END_DEG = 180;
    this.CHANCE = 22.4;
  }
}

class PigOnNose extends PigState {
  init() {
    this.NAME = "Snouter";
    this.END_DEG = 0;
    this.CHANCE = 3;
  }

  _comple_anim() {
    return [
      { transform: `rotate(0deg) scale(1)` },
      {
        transform: `rotate(${
          360 * this.SPIN_COUNT - this.END_DEG
        }deg) scale(1, 0.5)`,
      },
    ];
  }
}

class PigOnFront extends PigState {
  init() {
    this.NAME = "Trotter";
    this.END_DEG = 0;
    this.CHANCE = 8.8;
  }
}

class PigOnRight extends PigState {
  init() {
    this.NAME = "Right side";
    this.END_DEG = 90;
    this.CHANCE = 34.9;
  }
}

class PigOnLeft extends PigState {
  init() {
    this.NAME = "Left side";
    this.END_DEG = 270;
    this.CHANCE = 30.2;
  }
}

class TiltedPig extends PigState {
  init() {
    this.NAME = "Leaning Jowler";
    this.END_DEG = 300;
    this.CHANCE = 0.7;
  }
}

class RollState {
  constructor(app) {
    this.app = app;

    this._init();
    this.init();
  }

  _init() {
    this.NAME = ":P (ha ha ha)";
  }

  init() {
    console.error("even more ha ha");
  }

  check() {
    return true;
  }

  get_states() {
    return this.app.pigs.map((pig) => {
      return pig.state.constructor;
    });
  }

  trigger() {
    console.error("ha ha ha");
  }
}

class PigOutState extends RollState {
  init() {
    this.NAME = "Pig Out";
  }

  trigger() {
    this.app.active_player.score_this_turn = 0;
    this.app.pass();
  }

  check() {
    return (
      this.get_states().includes(PigOnLeft) &&
      this.get_states().includes(PigOnRight)
    );
  }
}

class SiderState extends RollState {
  init() {
    this.NAME = "Sider";
  }

  check() {
    return (
      (this.get_states()[0] == PigOnLeft ||
        this.get_states()[0] == PigOnRight) &&
      this.get_states()[1] == this.get_states()[0]
    );
  }

  trigger() {
    this.app.active_player.score_this_turn += 1;
  }
}

class TrotterState extends RollState {
  init() {
    this.NAME = "Trotter";
  }

  check() {
    return (
      this.get_states().includes(PigOnFront) &&
      (this.get_states().includes(PigOnLeft) ||
        this.get_states().includes(PigOnRight))
    );
  }

  trigger() {
    this.app.active_player.score_this_turn += 5;
  }
}

class DoubleTrotterState extends RollState {
  init() {
    this.NAME = "Double Trotter";
  }

  check() {
    return (
      this.get_states()[0] == PigOnFront && this.get_states()[1] == PigOnFront
    );
  }

  trigger() {
    this.app.active_player.score_this_turn += 20;
  }
}

class RazorbackState extends RollState {
  init() {
    this.NAME = "Razorback";
  }

  check() {
    return (
      this.get_states().includes(PigOnBack) &&
      (this.get_states().includes(PigOnLeft) ||
        this.get_states().includes(PigOnRight))
    );
  }

  trigger() {
    this.app.active_player.score_this_turn += 5;
  }
}

class DoubleRazorbackState extends RollState {
  init() {
    this.NAME = "Double Razorback";
  }

  check() {
    return (
      this.get_states()[0] == PigOnBack && this.get_states()[1] == PigOnBack
    );
  }

  trigger() {
    this.app.active_player.score_this_turn += 20;
  }
}

class SnouterState extends RollState {
  init() {
    this.NAME = "Snouter";
  }

  check() {
    return (
      this.get_states().includes(PigOnNose) &&
      (this.get_states().includes(PigOnLeft) ||
        this.get_states().includes(PigOnRight))
    );
  }

  trigger() {
    this.app.active_player.score_this_turn += 10;
  }
}

class DoubleSnouterState extends RollState {
  init() {
    this.NAME = "Double Snouter";
  }

  check() {
    return (
      this.get_states()[0] == PigOnNose && this.get_states()[1] == PigOnNose
    );
  }

  trigger() {
    this.app.active_player.score_this_turn += 40;
  }
}

class LeaningJowlerState extends RollState {
  init() {
    this.NAME = "Snouter";
  }

  check() {
    return (
      this.get_states().includes(TiltedPig) &&
      (this.get_states().includes(PigOnLeft) ||
        this.get_states().includes(PigOnRight))
    );
  }

  trigger() {
    this.app.active_player.score_this_turn += 15;
  }
}

class DoubleLeaningJowlerState extends RollState {
  init() {
    this.NAME = "Double Snouter";
  }

  check() {
    return (
      this.get_states()[0] == TiltedPig && this.get_states()[1] == TiltedPig
    );
  }

  trigger() {
    this.app.active_player.score_this_turn += 40;
  }
}

class MixedComboState extends RollState {
  init() {
    this.NAME = "Mixed Combo";
  }

  check() {
    const states = [
      [PigOnBack, 5],
      [PigOnFront, 5],
      [PigOnNose, 10],
      [TiltedPig, 15],
    ];

    this.valid = [];

    for (let i in states) {
      if (this.get_states().includes(states[i][0])) {
        this.valid.push(states[i]);

        if (this.valid.length >= 2) {
          return true;
        }
      }
    }
  }

  trigger() {
    for (let i in this.valid) {
      this.app.active_player.score_this_turn += this.valid[i][1];
    }
  }
}

class Ai extends Player {
  constructor(app, id) {
    super(id);
    this.app = app;
    this.init();
  }

  pass_behavior() {}

  on_pass() {
    this.pass_behavior();
  }

  on_turn() {
    this.app.ai_rolling = true;

    setTimeout(() => {
      this.turn_behavior();
      this.app.ai_rolling = false;
    }, Math.random() * 1500 + 500);
  }
}

class Robot extends Ai {
  turn_behavior() {
    if (this.app.first_roll) {
      this.app.roll(true);
      return;
    }
    if (this.score_this_turn > 20) {
      this.app.pass(true);
      return;
    }
    if (Math.random() < 0.8) {
      this.app.roll(true);
      return;
    }
    this.app.pass(true);
  }

  init() {
    const names = ["John", "Eleanor", "Tom", "Steve", "Bob", "Alice", "Eve"];
    this.name = random_choice(names);
  }
}

class DivinePig extends Pig {
  constructor(app, winner) {
    super(app);

    this.winner = winner;
  }

  compute_roll() {
    const winning_numbers = [0, 3, 5];

    const losing_numbers = [0, 1, 3, 4];

    if (this.app.playerID == this.winner) {
      return this.states[random_choice(winning_numbers)];
    }
    return this.states[random_choice(losing_numbers)];
  }
}

class God extends Ai {
  init() {
    this.name = "Felix";
    this.torture_counter = 0;

    this.app.create_pigs = () => {
      this.my_pigs_now(this.ID);
    };
  }

  my_pigs_now(winner) {
    this.app.pigs = [];
    for (let i = 0; i < this.app.NUMPIGS; i++) {
      this.app.pigs.push(new DivinePig(this.app, winner));
    }
  }

  turn_behavior() {
    if (this.torture_counter < 7) {
      this.app.roll(true);
      this.torture_counter++;
    } else {
      this.app.pass(true);
    }
  }

  pass_behavior() {
    this.torture_counter = 0;
  }
}

let app;

function launch() {
  app = new App();
}

launch();
