<template>
  <div>
    <div>
      <text-field v-model='symbolsText' autofocus :onKeyUp='chartQuotes' placeholder='AAPL,MSFT,SPY' />
      <primary-button :onClick='chartQuotes'>Get Quote</primary-button>
      <secondary-button :onClick='showPeers'>Show Peers</secondary-button>
    </div>
    <div class="svg-container">
      <svg width="700" height="500" />
    </div>
    <div>
      {{startDate.format('M/D/Y')}}
      -
      {{endDate.format('M/D/Y')}}
    </div>
    <div class="legend">
      Legend
      <ul id="example-2">
        <li v-for="(item, index) in getSymbols()">
          <a @click='setBaseline(item.symbol)' style="cursor: pointer">
            <span :style="{ color: item.color  }">
              {{item.symbol}}
              {{item.symbol === baselineText ? "(baseline)" : ""}}
            </span>
          </a>
        </li>
      </ul>
      <a gclick='setBaseline(baselineText)' style="cursor: pointer">
        <span>
          Baseline: {{baselineText}}
        </span>
      </a>
    </div>
  </div>
</template>


<script lang="ts">
import Vue from "vue";
import * as d3 from "d3";
import flatten from "lodash/flatten";
import moment from "moment";
import debounce from "lodash/debounce";
import {getPeers, getQuote} from "../services/graphql";
import {getTweets} from "../services/tweets";

import ApiData from "../interfaces/ApiData";
import ApiQuote from "../interfaces/ApiQuote";
import BaseData from "../interfaces/BaseData";
import ChartVue from "../interfaces/ChartVue";
import Quote from "../interfaces/Quote";
import * as Tweet from "twitter-d";
import QuoteData from "../interfaces/QuoteData";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import TextField from "@/components/TextField";

const colors = [
  "red",
  "blue",
  "green",
  "purple",
  "orange",
  "black",
  "gold",
  "fuscia",
  "turqoise",
];

export default Vue.extend({
  name: "Chart",
  data: (): BaseData => {
    return {
      baseline: null,
      baselineText: "",
      lastD3Event: null,
      quotes: [],
      tweets: [],
      startDate: moment().add(-1, "year"),
      endDate: moment(),
      symbols: ["TSLA"],
      symbolsText: "TSLA",
    };
  },
  components: {PrimaryButton, SecondaryButton, TextField},
  mounted: function() {
    this.chartQuotes();
    this.setTwitterData();
    d3.select(window).on(
      "resize",
      function(this: ChartVue) {
        var svgContainer = d3.select(".svg-container");
        var svg = d3.select("svg");
        var node: any = svgContainer.node();
        var container = node.getBoundingClientRect();
        svg.attr("width", container.width);
        svg.attr("height", container.height);
        this.draw(this.quotes);
      }.bind(this),
    );
  },
  methods: {
    setTwitterData: async function() {
      this.tweets = await getTweets();
    },
    setBaseline: function(symbol: string) {
      if (this.baselineText === symbol) {
        this.baselineText = "";
      } else {
        this.baselineText = symbol;
      }

      this.draw(this.quotes);
    },
    getSymbols: function() {
      return this.symbolsText.split(",").map((symbol, index) => ({
        symbol,
        color: colors[index],
      }));
    },
    showPeers: async function() {
      const symbol = this.symbolsText.split(",")[0];
      const peers = await getPeers(symbol);
      if (peers.data.length > 0) {
        this.$set(this, "symbolsText", `${symbol},${peers.data.join(",")}`);
        this.chartQuotes();
      }
      return peers;
    },
    chartQuotes: async function() {
      this.symbols = this.symbolsText.split(",");

      const quotes: Array<Quote> = [];
      for (var symbol of this.symbols) {
        const quote = await getQuote(symbol);
        quotes.push(quote);
      }

      this.quotes = quotes;

      this.draw(quotes);
    },
    mapQuote(quote: ApiQuote): Quote {
      const baseline =
        !this.baseline || this.baseline.symbol === quote.symbol
          ? quote
          : this.baseline;

      return {
        ...quote,
        data: quote.data.map((d: ApiData, i: number): QuoteData => ({
          ...d,
          closeAtStartDate: quote.data[0].close,
          baseline: this.baselineText
            ? {
                close: baseline.data[i].close,
                closeAtStartDate: baseline.data[0].close,
              }
            : null,
        })),
      };
    },
    mapQuotes(quotes: Quote[]) {
      return quotes.map(this.mapQuote);
    },
    filterQuote(quote: Quote) {
      return {
        ...quote,
        data: quote.data.filter((item: ApiData) => {
          return moment(item.date) > this.startDate;
        }),
      };
    },
    filterQuotes(quotes: Quote[]) {
      return quotes.map(this.filterQuote);
    },
    draw: async function(rawQuotes: Array<Quote>) {
      this.baseline = this.baselineText
        ? this.mapQuote(this.filterQuote(await getQuote(this.baselineText)))
        : null;
      const quotes = this.mapQuotes(this.filterQuotes(rawQuotes));

      var svgContainer = d3.select(".svg-container");
      var svg = d3.select("svg");
      const node: any = svgContainer.node();
      const container = node.getBoundingClientRect();
      var margin = {top: 20, right: 20, bottom: 30, left: 50};

      svg.attr("width", container.width);
      svg.attr("height", container.height);
      var width = container.width - margin.left - margin.right;
      var height = container.height - margin.top - margin.bottom;

      const firstNode: any = svg.nodes()[0];
      if (firstNode.children.length) {
        // Redraw
        d3.select("g").remove();
      }

      const doZoom = () => {
        const event = d3.event || this.lastD3Event;
        const increment = event.sourceEvent.deltaY;
        if (event && event.sourceEvent.deltaY > 0) {
          const minDate = moment(
            this.quotes[0].data
              .map(data => data.date)
              .reduce((min: any, next: any): any => {
                if (!min) {
                  return next;
                }

                if (moment(min) < moment(next)) {
                  return min;
                }

                return next;
              }),
          );

          if (this.startDate > minDate) {
            this.$set(
              this,
              "startDate",
              moment(this.startDate).add(increment * -1, "day"),
            );
            this.draw(this.quotes);
          }
        } else if (event && event.sourceEvent.deltaY < 0) {
          const data = this.quotes[0].data;
          if (!data) {
            return;
          }

          const maxDate = moment(
            data.map(data => data.date).reduce((max: any, next: any): any => {
              if (!max) {
                return next;
              }

              if (moment(max) > moment(next)) {
                return max;
              }

              return next;
            }),
          ).add(increment * 2, "day");

          if (moment(this.startDate) < maxDate) {
            this.$set(
              this,
              "startDate",
              moment(this.startDate).add(increment * -1, "day"),
            );
            this.draw(this.quotes);
          }
        }
      };
      const debounced = debounce(doZoom, 10, {maxWait: 30});
      const saveEvent = () => {
        this.lastD3Event = d3.event;
      };
      const handleZoomEvent = () => {
        saveEvent();
        // debounced();
        doZoom();
      };

      var zoom = d3.zoom().on("zoom", handleZoomEvent);

      svg.call(zoom);

      var g = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var parseTime = d3.timeParse("%Y-%m-%d");

      var x = d3.scaleTime().rangeRound([0, width]);

      var y = d3.scaleLinear().rangeRound([height, 0]);

      const getAmount = (d: QuoteData) => {
        let value =
          this.quotes.length === 1 ? d.close : d.close / d.closeAtStartDate;

        if (d.baseline) {
          value = value / (d.baseline.close / d.baseline.closeAtStartDate);
        }

        return value;
      };

      const allQuoteData = flatten(quotes.map((q: Quote) => q.data));
      x.domain(
        d3.extent(allQuoteData, function(d: ApiData) {
          return parseTime(d.date);
        }),
      );
      y.domain(
        d3.extent(allQuoteData, function(d: QuoteData) {
          return getAmount(d);
        }),
      );

      g
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .select(".domain")
        .remove();

      g
        .append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text(
          quotes.length === 1 ? "Price ($)" : "Percent (increase/decrease)",
        );

      const drawLine = (data: ApiData[], i: number) => {
        // const max = data.reduce((largest, next) => largest.close > next.close ? largest : next, 0).close;
        const closeAtStartDate = data[0].close;

        var line: any = d3
          .line()
          .x((d: any) => {
            return x(parseTime(d.date));
          })
          .y((d: any) => {
            return y(getAmount(d));
          });

        g
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", colors[i])
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 1.5)
          .attr("d", line);
      };

      quotes.forEach((quote: Quote, i: number) => drawLine(quote.data, i));
    },
  },
});
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

.legend {
  color: steelblue;
  margin: 24px;
}

.svg-container {
  width: 80%;
  max-width: 1000px;
  height: 60vh;
  margin: auto;
}
</style>
