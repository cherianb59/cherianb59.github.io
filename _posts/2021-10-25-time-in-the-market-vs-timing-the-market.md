## Time in the Market vs Timing the Market

Timing the perfect moment to buy and sell assets is difficult, most fund managers investing in a specific asset class spend all their time styduying and anlysing it, but they don't even beat the index of that class and they charge high fees. The academic advice is to invest in a low fee fund that replicates the index, but this isn't risk free, indexes can fall. Suppose  you went back in time, bought an asset and then after a fixed period e.g. 1 day, 1 week, 1 year you sold it. Depending on the  day you went back you would have a different return. 

This visualisation shows how changing the amount of time holding an asset changes the distribution of your returns.
Play around with the slider and the different indexes, I've found holding assets for less time increases your the variability of the return and the expected return.

<script src="https://d3js.org/d3.v4.js"></script>

<div id="my_dataviz" style=" width:90%;">
    <div class="controls">    
    <div class="symbolcontainer">
        <label for="symbol">What are you investing in?</label>
        <select name="symbol" id="symbol">
          <option value="NDQ.AX">Betashares NASDAQ 100 ETF (NDQ)(AUD)</option>
                  <option value="IVV.AX">iShares S&amp;P 500 ETF (IVV) (AUD)</option>
                  <option value="IOO.AX">iShares International 100 (IOO) (AUD)</option>
                  <option value="VAS.AX">Vanguard Australian Shares (VAS) (AUD)</option>
                  <option value="VGS.AX">Vanguard MSCI Index International Shares ETF (VGS) (AUD)</option>                
          <option value="STW.AX">State Street ASX 200 ETF (STW) (AUD)</option>
          <option value="SPY.AX">Betashares S&amp;P 500 (SPY) (AUD)</option>
          <option value="QQQ">NASDAQ ETF (QQQ) (USD) </option>
                  <option value="SPY">NYSE ETF (SPY)(USD) </option>
          <option value="CL=F">Oil (USD) </option>
          <option value="GC=F">Gold (USD) </option>
          <option value="AUDUSD=X"> US Dollars (AUD) </option>
        </select> 
    </div>
    <div id="slide_length">How many weeks are you holding for?</div>
    <div class="slidecontainer">
              <input type="range" min="2" max="104" value="50" class="slider" id="delay" style=" width:70%;">
    </div>
        <div id="slider"></div>

    
    </div>

    <div id="statistics">
        <div id="dates">        </div>
        <div id="neg_return">        </div>
        <div id="mean">        </div>
        <div id="stddev">        </div>
        <div id="delay">        </div>
    </div>
    <div id="my_dataviz_svg">
        </div>

</div>


<script>
    
//functions for percentile from https://stackoverflow.com/questions/48719873/how-to-get-median-and-quartiles-percentiles-of-an-array-in-javascript-or-php
const asc = arr => arr.sort((a, b) => a - b);

const sum = arr => arr.reduce((a, b) => a + b, 0);

const mean = arr => sum(arr) / arr.length;

const quantile = (arr, q) => {
    const sorted = asc(arr);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
};
function getStandardDeviation (array) {
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}
    
function roundNumber(num, scale) {
  if(!("" + num).includes("e")) {
    return +(Math.round(num + "e+" + scale)  + "e-" + scale);
  } else {
    var arr = ("" + num).split("e");
    var sig = ""
    if(+arr[1] + scale > 0) {
      sig = "+";
    }
    return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
  }
}
    
// set the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 30, left: 30},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz_svg")
  .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
   .attr("viewBox", "0 0 800 400")
   //class to make it responsive
   .classed("svg-content-responsive", true)
   .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")")
;

// get the data, api only returns business days
function update_symbol(nSymbol){
  d3.csv("https://api.dsssmble.top/acc?symbol="+nSymbol, function(data) {
    var start_date = data[0]['date'] ;

    var max_weeks = Math.floor(data.length/5) ; 
    //Make slider max based on data available in symbol
    d3.select('#delay').attr('max', max_weeks - 10 );
    function update_delay(delay_weeks) {
    d3.select('#slider').text(delay_weeks+" weeks");
    //one week is five business days
    var delay_days = delay_weeks * 5  ; 
    var end_date = data[data.length - delay_days]['date'] ;
    var num_days = data.length - delay_days ; 
    // sometimes price is negative, capp it.
    var p1 = data.slice(0, data.length - delay_days).map(function(d) { return Math.max(d.acc,0.01); }); 
    var p2 = data.slice(delay_days, data.length ).map(function(d) { return Math.max(d.acc,0.01); }); 
        
    //create annulaised return    
    var data2 = p1.map(function(n, i) { return 100 * ((p2[i] /n) ** ( (365.25/7)/delay_weeks) -1)  ; });
    var data2_log = p1.map(function(n, i) { return Math.log( ((p2[i] /n) ** ( (365.25/7)/delay_weeks) ))  ; }); 
        
    //cap returns between 1 and 95 percentile 
    var p_max = quantile(data2,0.95);
    var p_min = quantile(data2,0.01);
    data2 = data2.map(x => Math.max(Math.min(x, p_max),p_min));
    var data2_length = data2.length ;   
        
    //number of times holding resulted in a negative return
    var neg_returns = data2.filter(x => x < 0).length   ; 
    //geometric mean and standard deviation
    var mean_return = (Math.exp(data2_log.reduce((a, b) => a + b) / data2_length) -1)*100 ; 
    var stddev_return = (Math.exp(getStandardDeviation(data2_log)) -1)*100;
        
    d3.select('#dates').text("If you bought this investment and then sold it after "+delay_weeks+" weeks, you could have invested on any of the "+num_days+" business days between "+start_date+" and "+end_date + "");
    d3.select('#mean').text("On average your annualised return would have been "+roundNumber(mean_return,0)+"%, it varied by "+roundNumber(stddev_return,0)+" percentage points and the distribution of returns looked like this.");
    d3.select('#neg_return').text( "Of the "+num_days+" days you could have bought this investment, on "+neg_returns+" of them  (" +roundNumber(100*neg_returns/data2_length,0)+"% of the time) you would have made a loss");

    // add title to chart 
    
    svg.selectAll(".title").remove();
    var title = svg.append("g")
    .attr("class", "title") 
    ;
    //
    title.append("text")
    .attr("x", (width / 2))             
    .attr("y", 0 - (margin.top / 3) )
    .attr("text-anchor", "middle")  
    .style("font-size", "16px") 
    .text(""); 

    // X axis: scale and draw:
    var x = d3.scaleLinear()
      .domain([Math.min.apply(null,data2),Math.max.apply(null,data2)])     
      .range([0, width]);

    // remove xaxis and then add it back (so it doesnt overlap previous axis drawing on update)
    svg.selectAll(".xaxis").remove();
    var xAxis = svg.append("g")
    .attr("class", "xaxis") 
    ;
    svg.selectAll(".xaxis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    ;

    // Y axis: initialization
    var y = d3.scaleLinear()
      .range([height, 0]);

    // A function that builds the graph for a specific value of bin
    var nBins = Math.max( Math.ceil(Math.log2(data2_length)), 3 ) ; 

    // set the parameters for the histogram
    var histogram = d3.histogram()
    .domain(x.domain())  // then the domain of the graphic
    .thresholds(x.ticks(nBins)); // number of ticks is  dynamic based on data2 length

    // And apply this function to data to get the bins
    var bins = histogram(data2);

    // Y axis: update now that we know the domain
    y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis 

    svg.selectAll(".yaxis").remove();
    var yAxis = svg.append("g")
              .attr("class", "yaxis")
    svg.selectAll(".yaxis")
    .transition()
    .call(d3.axisLeft(y))
    ;

    // Join the rect with the bins data
    var u = svg.selectAll("rect")
        .data(bins)

    // Manage the existing bars and eventually the new ones:
    u
        .enter()
        .append("rect") // Add a new rect for each new elements
        .merge(u) // get the already existing elements as well
        .transition() // and apply changes to all of them
        .duration(1000)
          .attr("x", 1)
          .attr("transform", function(d) { return "translate(" + x(d.x0) + 1 + "," + y(d.length) + ")"; })
          .attr("width", function(d) { return (0.99 * (x(d.x1) - x(d.x0)))  ; })
          .attr("height", function(d) { return height - y(d.length); })
          //.style("fill", "#69b3a2")
          .style("fill", function(d) { if (d.x0 >= 0) {return "#69b3a2";} else {return "#c92322";}  })


    // If less bar in the new histogram, I delete the ones not in use anymore
    u
        .exit()
        .remove()

    }

    // read delay from slider 
    update_delay(Math.min(d3.select('#delay').property('value'),max_weeks))


    // Listen to the button -> update if user change it
    d3.select("#delay").on("input", function() {
    update_delay(+this.value);
    });
         
})
};
        update_symbol(d3.select('#symbol').property('value') )
// handle on click event
    d3.select('#symbol').on('change', function() {
        var newData = d3.select(this).property('value');
        update_symbol(newData);
    });
    
    
</script>





- Data comes from Yahoo Finance(YF) which does not correctly report dividends.
- Returns are based on close prices and assumes dividends are immediately reinvested. 
- The average return and variation is the geometric mean and standard deviation of the returns.
- Closing prices may sometimes be negative, it is capped at 1 cent to keep the results sensible
- Return values are capped at the first percentile and ninety-ninth percentile to give reasonable results for highly volatile assets. 
- Past performance doesn't guarantee future results.
