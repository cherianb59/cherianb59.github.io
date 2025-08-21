## Simulating Ultimate Frisbee

### Assumptions 

Team A starts on offence and with their offensive line, team B starts with their defensive line.

Each team a team has possesion they have a fixed chance of turning it over, if they don't turn it over they score.

Whenever a team scores they use their defensive line on the next point and the other team uses
their offensive line.

The exception is when half time is reached, on the next point Team B starts on offence with their
offensive line and Team A uses their defensive line.

### Parameters 

#### Turnover Likelihood Estimation

Estimate how likely your team is to turn over the disc, enter the score and turnovers for both teams.


<div class="row" >
            <div class="col-sm-4"></div>
            <div class="col-sm-1"> <span class="col-1-paragraph">A team score </span></div>  <input class="col-sm-1" type="text" type="number" id="a_score"> 
            <div class="col-sm-1"> <span class="col-1-paragraph">B team score </span></div> <input class="col-sm-1" type="text" type="number" id="b_score"> 
            <div class="col-sm-4"></div>
</div>
          <br>
  <div class="row" >
    <div class="col-sm-4"></div>
    <div class="col-sm-1"> A team turnovers </div> <input class="col-sm-1" type="text" type="number" id="a_turnovers"> 
    <div class="col-sm-1"> B team turnovers </div> <input class="col-sm-1" type="text" type="number" id="b_turnovers"> 
    <div class="col-sm-4"></div>
  </div>
          <div class="row" >
            <div class="col-sm-12"> 
              <br><input type="submit" id="calc_simple_turnover" value="Calculate" class="btn btn-default btn-lg btn-primary"></div>
</div>