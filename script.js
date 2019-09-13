'use strict';

let hidden = document.visibilityState === 'visible' ? false : true;
let app, timer, lastUpdated;

document.addEventListener("DOMContentLoaded", function() {
    app = new Vue({
        el: "#container",
        data: {
            location: null,
            weather: null,
            time: null,
            dsapikey: null,
            newsapikey: null,
            skycons: new Skycons(),
            newssources: [
                { title: "Ars Technica", Homepage: "https://arstechnica.com", type: "news", Url: "arstechnica.com", articles: null, gridPosition: 1 },
                { title: "AnandTech", Homepage: "https://www.anandtech.com/", type: "rss", Url: "https://www.anandtech.com/rss/", articles: null, gridPosition: 2 },
                { title: "Google - Top Stories", Homepage: "https://news.google.com/?hl=en-US&gl=US&ceid=US:en", type: "rss", Url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", articles: null, gridPosition: 3 },
                { title: "MMO-Champion", Homepage: "https://www.mmo-champion.com", type: "rss", Url: "https://www.mmo-champion.com/external.php?do=rss&type=newcontent&sectionid=1&days=30", articles: null, gridPosition: 4 },
                { title: "PC Gamer", Homepage: "https://www.pcgamer.com", type: "news", Url: "pcgamer.com", articles: null, gridPosition: 5 }
            ]
        },
        mounted: function() {
            this.GetTime();
            this.location = this.GetLocation();
            if (dsapikey)
                this.dsapikey = dsapikey;
            if (newsapikey)
                this.newsapikey = newsapikey;
        },
        watch: {
            dsapikey: function() {
                this.GetWeather();
            },
            newsapikey: function() {
                this.GetNews();
            }
        },
        methods: {
            GetLocation: function() {
                if (!localStorage.getItem("location")) {
                    navigator.geolocation.getCurrentPosition((position) => {
                        localStorage.setItem("location", JSON.stringify({ "lat": position.coords.latitude, "long": position.coords.longitude }));
                    });
                }

                const navloc = JSON.parse(localStorage.getItem("location"));
                return { lat: navloc.lat, long: navloc.long };
            },
            GetTime: async function() {
                if (hidden)
                    return;

                this.time = new Date().toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
                setTimeout(() => this.GetTime(), 25);
            },
            GetWeather: async function() {
                if (!this.dsapikey || hidden)
                    return;
            
                fetch(`https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/${this.dsapikey}/${this.location.lat},${this.location.long}`)
                .then((res) => res.json())
                .then((res) => {
                    this.weather = res;
                    this.skycons.add("weatherIcon", res.currently.icon);
                    this.skycons.play();
                });

                setTimeout(() => this.GetWeather(), 900000);
            },
            GetNews: async function() {
                if (hidden || !this.newsapikey)
                    return;

                for (let item of this.newssources) {
                    if (item.type === "rss") {
                        const res = await fetch(`https://cors-anywhere.herokuapp.com/${item.Url}`);
                        const str = await res.text();
                        const data = await (new DOMParser()).parseFromString(str, "application/xml");

                        let articles = [];
                        for (var i=0; i <= 4; i++) {
                            articles.push({ title: data.getElementsByTagName("item")[i].getElementsByTagName("title")[0].innerHTML, link: data.getElementsByTagName("item")[i].getElementsByTagName("link")[0].innerHTML });
                        }
                        item.articles = articles;
                    }
                    else {
                        const res = await fetch(`https://newsapi.org/v2/everything?domains=${item.Url}&apiKey=${this.newsapikey}`);
                        const data = await res.json();
                        
                        let articles = [];
                        for (var i=0; i <= 4; i++) {
                            articles.push({ title: data.articles[i].title, link: data.articles[i].url });
                        }
                        item.articles = articles;
                    }
                }

                setTimeout(() => this.GetNews(), 900000);
            },
            FormatTemperature: function(temp) {
                return Math.round(temp) + "°";
            },
            FormatWeekday: function(time) {
                return (new Date(time * 1000)).toLocaleDateString("en", {weekday: "short"});
            }
        }
    });

    Vue.component("weather-icon", {
        props: ["icon"],
        template: "<canvas width='50' height='50'></canvas>",
        mounted: function() {
            app.skycons.add(this.$el, this.icon)
        }
    });
});