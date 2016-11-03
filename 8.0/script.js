console.log('8.3');

var m = {t:100,r:100,b:100,l:100};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

//d3.set to hold a unique array of airlines
var airlines = d3.set();

//Scale
var scaleX = d3.scaleTime()
    .range([0,w]);
var scaleColor = d3.scaleOrdinal()
    //.domain(['B6','UA','SY','VX','AS']) I wrote it
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue']);
var scaleY = d3.scaleLinear()
    .domain([0,1000])
    .range([h,0]);

//Axis
var axisX = d3.axisBottom()
    .scale(scaleX)
    .tickSize(-h);
var axisY = d3.axisLeft()
    .scale(scaleY)
    .tickSize(-w);

//Line generator
var lineGenerator = d3.line()
    .x(function(d){return scaleX(new Date(d.key))})
    .y(function(d){return scaleY(d.averagePrice)})
    .curve(d3.curveCardinal);

d3.queue()
    .defer(d3.csv, '../data/bos-sfo-flight-fare.csv',parse)
    .await(function(err, data){

        //Mine the data to set the scales
        scaleX.domain( d3.extent(data,function(d){return d.travelDate}) );
        scaleColor.domain( airlines.values() );
      
        //Add buttons
        d3.select('.btn-group')
            .selectAll('.btn')
            .data( airlines.values() )
            .enter()
            .append('a')
            .html(function(d){return d})
            .attr('href','#')
            .attr('class','btn btn-default')
            .style('color','white')
            .style('background',function(d){return scaleColor(d)})
            .style('border-color','white')
            .on('click',function(d){
                function drawByAirline(data){
                    return data.airline == d;
                }
                var QQ = data.filter(drawByAirline);
                draw(QQ);                
                //Hint: how do we filter flights for particular airlines?
                //data.filter(...)
                //How do we then update the dots?
            });

        //Draw axis
        plot.append('g').attr('class','axis axis-x')
            .attr('transform','translate(0,'+h+')')
            .call(axisX);
        plot.append('g').attr('class','axis axis-y')
            .call(axisY);

        //append path
        plot.append('path')
            .attr('class','date-series');
        //draw(data);

    });

function draw(rows){
    //IMPORTANT: data transformation
    rows.sort(function(a,b){
        return a.travelDate - b.travelDate;
    });

    var flightsByTravelDate = d3.nest().key(function(d){return d.travelDate})
        .entries(rows);

    flightsByTravelDate.forEach(function(day){
       day.averagePrice = d3.mean(day.values, function(d){return d.price});
    });
    

    console.log(flightsByTravelDate);

    //Draw dots
    var node = plot.selectAll('.flight')
        .data(rows,function(d){return d.id});

    var enter = node.enter()
        .append('circle').attr('class','flight')
        .on('click',function(d,i){
            console.log(d);
            console.log(i);
            console.log(this);
        })
        .on('mouseenter',function(d){
            var tooltip = d3.select('.custom-tooltip')
              .style('opacity',1);
            tooltip.select('.title')
                   .html(d.airline);
            tooltip.select('.value')
                   .html('$'+d.price);
            d3.select(this).style('stroke-width','3px');
        })
        .on('mousemove',function(d){
            var tooltip = d3.select('.custom-tooltip');
            var xy = d3.mouse(d3.select('.container').node());
            tooltip
                .style('left',xy[0]+10+'px')
                .style('top',xy[1]+10+'px');
        })
        .on('mouseleave',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip.transition().style('opacity',0);
            d3.select(this).style('stroke-width','0px');
        });
        

        //Draw <path>
    plot.select('.date-series')
        .datum(flightsByTravelDate)
        .transition()
        .attr('d',lineGenerator)
        .style('fill','none')
        .style('stroke-width','2px')
        .style('stroke',function(array){
            return scaleColor(array[0].values[0].airline)
        });


    node.merge(enter)
        .attr('r',3)
        .attr('cx',function(d){return scaleX(d.travelDate)})
        .attr('cy',function(d){return scaleY(d.price)})
        .style('fill',function(d){return scaleColor(d.airline)})
        .style('fill-opacity',.5);

    node.exit().remove();

}

function parse(d){

    if( !airlines.has(d.airline) ){
        airlines.add(d.airline);
    }

    return {
        airline: d.airline,
        price: +d.price,
        travelDate: new Date(d.travelDate),
        duration: +d.duration,
        id: d.id
    }
}