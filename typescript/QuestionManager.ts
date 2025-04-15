
class Question {
    question: string;
    options: Array<string>;
    answer_index: number;
    constructor(question:string, options: Array<string>, answer_index: number){
        if (options.length != 4) return this || console.error("options parameter item count can't higher or lower than 4!");
        this.question = question;
        this.options = options;
        this.answer_index = answer_index;
    }
}

class QuizStats {
    correct: number = 0;
    incorrect: number = 0;
    pass: number = 0;
    time: number = 0;
    date: Date = new Date();

    static fromJSON(value: Object) {
        let out       = new QuizStats();
        out.correct   = value["c"]??out.correct;
        out.incorrect = value["i"]??out.incorrect;
        out.pass      = value["p"]??out.pass;
        out.time      = value["t"]??out.time;
        out.date.setTime(value["d"]??out.date.getTime());
        return out;
    }

    static deserialize(value: string) {
        let json = JSON.parse(atob(value));
        let out  = QuizStats.fromJSON(json);
        return out
    }

    toJSON() {
        let out  = {};
        out["c"] = this.correct;
        out["i"] = this.incorrect;
        out["p"] = this.pass;
        out["t"] = this.time;
        out["d"] = this.date.getTime();
        return out;
    }

    serialize(){
        let json_string = JSON.stringify(this.toJSON())
        let out = btoa(json_string);
        return out;
    }
}

var QuestionManager = new (class _QuestionManager {

    
     //================ PARAMETERS ==================

    penalty_time: number = 10000;
    shortcuts = {
        option_0: 'a',
        option_1: 's',
        option_2: 'd',
        option_3: 'f',

        option_pass: ' ',
    }

     //==================================

    generator   = () : Question=>{return new Question("insert.question", ["option.0","option.1","option.2","option.3"], 0)};
    on_stop     = (stats:any)=>{};

    start_time: number;
    end_time: number;
    timer_update_interval_handle = 0;

    is_ended: boolean = true;

     //==================================

    node_question: HTMLElement;
    
    node_options_0: HTMLElement;
    node_options_1: HTMLElement;
    node_options_2: HTMLElement;
    node_options_3: HTMLElement;
    node_options_pass: HTMLElement;


    node_timer: HTMLElement;
    node_correct: HTMLElement;
    node_incorrect: HTMLElement;
    node_remaining_questions: HTMLElement;
    
     //==================================

    current_question: Question;

    total_questions: number;
    remaining_questions: number;

    stats: QuizStats;

    last_one_passed: boolean;

     //==================================

    constructor(){
        document.addEventListener("DOMContentLoaded", ()=>{
            QuestionManager.init();
        })
    }

     //==================================
    init() {
        this.node_question = document.getElementById("question")!;
        
        this.node_options_0 = document.getElementById("option_0")!;
        this.node_options_1 = document.getElementById("option_1")!;
        this.node_options_2 = document.getElementById("option_2")!;
        this.node_options_3 = document.getElementById("option_3")!;

        this.node_options_pass = document.getElementById("option_pass")!;

        this.node_timer = document.getElementById("timer")!;

        this.node_remaining_questions = document.getElementById("qcount")!;

        document.addEventListener("keydown", (event)=>{
            if (event.key == this.shortcuts.option_0) QuestionManager.node_options_0?.click();
            else if (event.key == this.shortcuts.option_1) QuestionManager.node_options_1?.click();
            else if (event.key == this.shortcuts.option_2) QuestionManager.node_options_2?.click();
            else if (event.key == this.shortcuts.option_3) QuestionManager.node_options_3?.click();
            else if (event.key == this.shortcuts.option_pass) QuestionManager.node_options_pass?.click();
        })

        this.start_time = new Date().getTime();
        this.total_questions = this.remaining_questions = 10;
        this.update_timer(this);
        this.update_counters();
        this.new_question();
        
    }

    start(question_count: number){

        this.start_time = new Date().getTime();
        this.total_questions = this.remaining_questions = question_count;
        this.update_timer(this);
        this.update_counters();
        this.new_question();

        this.stats = new QuizStats();
        this.last_one_passed = false;
        this.is_ended = false;
        
        this.timer_update_interval_handle = setInterval(this.update_timer,7,this);
    }
    a = 0;
    new_question() {
        this.current_question = this.generator();
        
        this.a += 1;
        this.node_question.innerText = this.current_question.question +"."+ this.a.toString();
        
        this.node_options_0.innerText = this.current_question.options[0];
        this.node_options_1.innerText = this.current_question.options[1];
        this.node_options_2.innerText = this.current_question.options[2];
        this.node_options_3.innerText = this.current_question.options[3];
    }

    update_timer = (that: _QuestionManager) => {
        that.node_timer.innerText = time_to_string((new Date().getTime()) - that.start_time);
    }

    update_counters() {
        this.node_remaining_questions.innerText = this.remaining_questions.toString()+"/"+this.total_questions.toString();
    }

    pass(){
        if(this.is_ended || this.last_one_passed) return;
        this.last_one_passed = true;
        this.new_question();
        this.node_options_pass.setAttribute("disabled","");
        this.stats.pass += 1;
    }
    
    answer(option_index: number) {
        if(this.is_ended) return;
        if(this.current_question.answer_index == option_index){
            this.stats.correct += 1;
            this.remaining_questions -= 1;
            this.last_one_passed = false;
            this.node_options_pass.removeAttribute("disabled");
        } else {
            this.stats.incorrect += 1;
            this.start_time -= this.penalty_time;

            let el = document.createElement("div");
            el.classList.add("timer-penalty");
            el.textContent = `+${this.penalty_time/1000}s`;
            this.node_timer.parentElement!.appendChild(el);
            setTimeout((e:HTMLElement)=>{
                e.remove();
            }, 1500, el);
        }

        this.update_counters()

        if(this.remaining_questions < 1)
        {
            this.end_time = (new Date()).getTime();
            this.stats.time = this.end_time - this.start_time;
            this.update_timer(this);

            this.on_stop(this.stats);
            clearInterval(this.timer_update_interval_handle);
            this.is_ended = true;
            console.log("quiz ended!");
            console.log(this.stats);
            this.result();
        }

        this.new_question();

    }



    result() {
        node_stat_correct.textContent = this.stats.correct.toString();
        node_stat_incorrect.textContent = this.stats.incorrect.toString();
        node_stat_pass.textContent = this.stats.pass.toString();
        node_stat_time.textContent = time_to_string(this.stats.time);
        node_stat_date.textContent = this.stats.date.toLocaleString("tr-TR");

        //let scoreboard: Array<QuizStats> = add_to_scoreboard(this.stats);
        let scoreboard: Array<QuizStats> = add_to_scoreboard(this.stats);
        scoreboard.sort((a,b)=>{
            return Number(a.time > b.time);
        })
        scoreboard.forEach(e=>{
            if(e.date == this.stats.date) add_to_scoreboard_node(e,true);
            else add_to_scoreboard_node(e);
        })

        document.getElementById("quiz")!.classList.add("disable");
        document.getElementById("result")!.classList.remove("disable");
        document.getElementsByClassName("entry-highlight")[0].scrollIntoView()
    }
})();

var node_scoreboard: HTMLElement;

var node_stat_correct: HTMLElement;
var node_stat_incorrect: HTMLElement;
var node_stat_pass: HTMLElement;
var node_stat_time: HTMLElement;
var node_stat_date: HTMLElement;


function add_to_scoreboard_random(stats: QuizStats) {
    let scoreboard: Array<QuizStats> = [];
    for(var i=0;i<10;i++){
        let stats_ = new QuizStats();
        stats_.correct = 10;
        stats_.incorrect = Math.floor(Math.random() * 20);
        stats_.pass  = Math.floor(Math.random() * 10);
        stats_.time = (stats_.incorrect * 10 + 30 + Math.floor(Math.random() * 60))*1000; 
        stats_.date.setTime(Date.now() - (1000 * 60 * 60 * Math.floor(Math.random() * 240)));
        scoreboard.push(stats_);
    }
    scoreboard.push(stats)
    return scoreboard;
}

function add_to_scoreboard(stats: QuizStats) {
    let scoreboard: Array<QuizStats> = get_scoreboard();
    scoreboard.push(stats);
    set_scoreboard(scoreboard);
    return scoreboard;
}

function get_scoreboard() {
    let scoreboard_string: string = Cookies.get("scoreboard")??"";
    let entries = scoreboard_string.split(",");

    

    let scoreboard: Array<QuizStats> = [];
    entries.forEach(
        (e:string)=>{
            if(e.trim()=="") return;
            try {
                scoreboard.push(QuizStats.deserialize(e));
            } catch (error) {
                console.log(`"Error: ${error}"`);
            }
            
        }
    )

    scoreboard.sort((a,b)=>{
        return Number(a.time > b.time);
    })
    return scoreboard;




}
function set_scoreboard(scoreboard: Array<QuizStats>) {
    if(scoreboard.length == 0) {
        Cookies.set("scoreboard","");
        return;
    }
    let value:string = "";
    scoreboard.forEach((e: QuizStats) => {
        value += ","+e.serialize()
    });
    value = value.slice(1);
    Cookies.set("scoreboard", value);
    return value
}


function time_to_string(time: number) {
    return Math.floor((time / 60000)).toString().padStart(2, "0") +
    ":" +
    Math.floor((time / 1000) % 60).toString().padStart(2, "0") +
    "." +
    Math.floor((time / 10) % 100).toString().padStart(2, "0")
}
function timeSince(date:Date) {

    var seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
    var interval = seconds / 31536000;
  
    if (interval > 1) {
      return Math.floor(interval) + " yıl önce";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " ay önce";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " gün önce";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " saat önce";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " dakika önce";
    }
    return Math.floor(seconds) + " saniye önce";
  }


function add_to_scoreboard_node(stats: QuizStats, highlight=false){
    let el = document.createElement("div");
    el.classList.add("score-entry");
    let elapsed_time = timeSince(stats.date);
    if (highlight){
        el.classList.add("entry-highlight");
        elapsed_time = "Şimdiki";
    }
    var options = { time: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    el.innerHTML = `<div class="entry-elapsed">${elapsed_time} </div>
                    <div class="entry-date">(${stats.date.toLocaleString("tr-TR")})</div>
                    <div class="entry-details">Doğru: ${stats.correct} | Yanlış: ${stats.incorrect} | Pas: ${stats.pass}</div>
                    <div class="entry-time">${time_to_string(stats.time)}</div>`
    node_scoreboard.appendChild(el);
    return el
}



document.onreadystatechange = ()=>{

    node_scoreboard = document.getElementById("score-list")!;

    node_stat_correct   = document.getElementById("stat-correct")!;
    node_stat_incorrect = document.getElementById("stat-incorrect")!;
    node_stat_pass      = document.getElementById("stat-pass")!;
    node_stat_time      = document.getElementById("stat-time")!;
    node_stat_date      = document.getElementById("stat-date")!;

    /* COUNT DOWN START */
    let count = 3;
    const el = document.getElementById('countdown-number')!;
    const wrapper = document.getElementById('countdown-overlay')!;

    var count_down_timeout = 0;
    var count_down_callback = e=>{
        if (e.key == " ") {
            clearTimeout(count_down_timeout);
            
            wrapper.remove();
            document.body.classList.remove("blur")
            QuestionManager.start(10)

            document.removeEventListener("keypress", count_down_callback)
            return;
        }
    }
    document.addEventListener("keypress", count_down_callback)

    function updateCountdown() {
    if (count === 0) {
        wrapper.remove();
        document.body.classList.remove("blur")
        QuestionManager.start(10)
        return;
    }
    el.textContent = count.toString();
    el.style.animation = 'none';
    void el.offsetWidth; // Trigger reflow
    el.style.animation = 'countdown-fade 1s linear forwards';
    count--;
    count_down_timeout = setTimeout(updateCountdown, 1000);
    }

    updateCountdown();

    /* COUNT DOWN END */
    console.log("hello there!");
}