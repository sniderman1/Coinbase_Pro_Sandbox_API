const CoinbasePro = require('coinbase-pro');
const publicClient = new CoinbasePro.PublicClient();
const chalk = require('chalk');
var inquirer = require('inquirer');
var fs = require('fs');


//Authentication for the API =========================================================================
//Just app your Coinbase pro sandbox api information here =================================================================

const key = 'your api key';
const secret = 'your api secret';
const passphrase = 'your api passphrase';

//End of authentication for the API ==================================================================

const sandboxURI = 'https://api-public.sandbox.pro.coinbase.com';

const authedClient = new CoinbasePro.AuthenticatedClient(
  key,
  secret,
  passphrase,
  sandboxURI
);

function main() {
    console.log("");
    console.log("           " +chalk.bold.magentaBright('Welcome to your CoinBase API'));
    console.log("");
    firstOption();
    };

// The first prompt of the program. Ask whether you would like to buy, sell.
var isBuy = Boolean;
var orderSide =""; //Stores a string based on "buy" or "sell"

function firstOption(){
    inquirer.prompt(buyOrSell).then(answers => {
        if(answers.options == "buy"){
            orderSide = "buy";
            isBuy = true;
            whatType();
        }
        if(answers.options == "sell"){
            orderSide = "sell"
            isBuy = false;
            whatType();
        }
    });
};

//Prompts for the command line ========================================================================

var buyOrSell =  {
    type: 'list',
    name: 'options',
    message: 'Would you like to buy or sell?',
    choices: ['Buy', 'Sell'],
    filter: function(val) {
    return val.toLowerCase();
    }
};

var whichCurrency = {
    type: 'list',
    name: 'options',
    message: 'What currency?',
    choices: ['BTC', 'BCH', 'ETH', 'LTC', 'DASH', 'ETC'],
    filter: function(val) {
    return val.toLowerCase();
    }
};

var priceToDoAction = {
    type: 'input',
    name: 'price',
    message: 'What price?',
    filter: function(val) {
    return val.toLowerCase();
    }
};

var sizeToDoAction = {
    type: 'input',
    name: 'size',
    message: 'How much?',
    filter: function(val) {
    return val.toLowerCase();
    }
};

var precentSellMargin = {
    type: 'input',
    name: 'marginSell',
    message: 'Sell margin %?',
    filter: function(val) {
    return val.toLowerCase();
    }
};

var precentBuyMargin = {
    type: 'input',
    name: 'marginBuy',
    message: 'Buy margin %?',
    filter: function(val) {
    return val.toLowerCase();
    }
};

var areYouSure = {
    type: 'list',
    name: 'confirm',
    message: 'Are you sure you want to proceed?',
    choices: ['Yes', 'No',],
    filter: function(val) {
    return val.toLowerCase();
    }
}; 

//End of prompts var ===========================================================================

var tradeID = "";

//The second prompt in the program. Ask which currency would you like to trade.

var currencyType =""

function whatType(){
    console.log();
    console.log("What currency would you like to " + orderSide + "?");
    whatTypeQuestion();
}

function whatTypeQuestion(){
    inquirer.prompt(whichCurrency).then(answers => {
        if(answers.options == "btc"){
            currencyType = "BTC";
            whatTypeBuySellCheck();
        }
        if(answers.options == "bch"){
            currencyType = "BCH";
            whatTypeBuySellCheck();
        }
        if(answers.options == "eth"){
            currencyType = "ETH";
            whatTypeBuySellCheck();
        }
        if(answers.options == "ltc"){
            currencyType = "LTC";
            whatTypeBuySellCheck();
        }
        if(answers.options == "dash"){
            currencyType = "DASH";
            whatTypeBuySellCheck();
        }
        if(answers.options == "etc"){
            currencyType = "ETC";
            whatTypeBuySellCheck();
        }
    });    
}

function whatTypeBuySellCheck(){
    if(isBuy === true){
        console.log();
        currencySearch = "USD";
        getAccountCurrnecyAvalilbleInfo();  
    }
    else{
        console.log();
        currencySearch = currencyType;
        getAccountCurrnecyAvalilbleInfo();
    }    
}

//Checks the amount of currency in your account. If you selected buy it will check the amount of USD that is in your account. 
//If you picked sell it will check the amount of currency that you picked in the previous prompt that is in your account.

var currencySearch = "";
var currencyAmountInAccount = 0;

function getAccountCurrnecyAvalilbleInfo(){
    authedClient.getAccounts((error, response, data) => {
        if (error) {
          console.log(error);
        } else {
            for(var i = 0; i < data.length; i++){
                if(data[i].currency === currencySearch){
                    currencyAmountInAccount = data[i].available;
                }
            }

            console.log(chalk.yellow("You currently have " + chalk.underline.bold(currencyAmountInAccount + " " 
            + currencySearch) + " in your account"));

            getCurrentPrice();
        }
      });
}

//Checks the current price of the currency you picked in the previous prompt

function getCurrentPrice(){
    publicClient.getProductTicker(currencyType + '-USD', (error, response, data) => {
        if (error) {
            console.log(error);
        } else {
            currentPrice = data.price;
            console.log(chalk.green("The current price of " + currencyType + " is: " + chalk.underline.bold(data.price + " USD")));
            console.log();
            maxOrder();
        }
        
    });
}

//Estimates the maximum amount you can either buy or sell, calculating the fee based off the amount of avalible currency in your account

var maximumOrder = 0;
var fee = 0;
var USDfee = 0;

function maxOrder(){
    if(isBuy === true){
        fee = (currencyAmountInAccount/currentPrice)*feeRate
        maximumOrder = (currencyAmountInAccount/currentPrice)- fee;
        USDfee = (currencyAmountInAccount * feeRate)
    }
    else{
        fee = (currencyAmountInAccount * feeRate);
        maximumOrder = (currencyAmountInAccount - fee); 
        USDfee = (fee * currentPrice);
    }
    console.log(chalk.red(chalk.bgWhite("The maximum amount of " + currencyType + " you can " + orderSide + " is:") + " " + chalk.underline.bold(maximumOrder)));
    console.log("With an estimated " + chalk.underline.bold(fee) + " fee in " + currencyType);
    console.log("With an estimated " + chalk.underline.bold(USDfee) + " fee in USD");
    priceOfOrder();
}

//This prompt ask you at what price would you like to buy or sell your currency. 

var tradePrice = "";

function priceOfOrder(){
    console.log();    
    if(currencyAmountInAccount == 0){
        console.log(chalk.bgRed("You do not have enough funds in your account"));
        return;
    }  
    else{
        console.log("At what price would you like to " + orderSide + " " + currencyType + "?");
        inquirer.prompt(priceToDoAction).then(answers => {
            tradePrice = Number(answers.price);
            console.log("The trade price is: " + tradePrice);
            sizeOfOrder();
        });        
    }  
}

//This prompt ask you how much of that currency you would like to buy or sell

var tradeSize = "";

function sizeOfOrder(){
    console.log();
    if(tradePrice <= 0 || Number.isNaN(tradePrice) === true){
        console.log(chalk.bgRed("You entered an invalled responds"));
        console.log("Please try again");
        return;
    }
    else{
        console.log("How much " + currencyType + " would you like to " + orderSide + "?");
        inquirer.prompt(sizeToDoAction).then(answers => {
            tradeSize = Number(answers.size);
            console.log("The size of trade is: " + tradeSize);
            checkTradeSize();
        });        
    }
}

//This prompt will ask how much crypto you would like to buy or sell

function checkTradeSize(){
    console.log();
    if(tradeSize <= 0 || Number.isNaN(tradeSize) === true){
        console.log(chalk.bgRed("You entered an invalled responds"));
        console.log("Please try again");
        return;
    }
    else{
      if(tradeSize > maximumOrder){
        console.log(chalk.bgRed("You entered an amount that is greater than the maximum amount you can " + orderSide));
        return
      }
      else{
        checkFees();
        setSellMargin();       
      }
    }
}

// This function checkes the size of the fee in both crypto and in USD

var feeRate = 0.005;
var estimatedFee = 0;
var estimatedUSDFee = 0;

function checkFees(){
 estimatedFee = (feeRate*tradeSize);
 estimatedUSDFee = (feeRate*tradeSize*currentPrice);
}

//These two function allow the user to set the buy and sell margin 

var sellMargin = 0;
var buyMargin = 0;

function setSellMargin(){
    console.log();
    console.log("What precentage would you like to sell at?");
    inquirer.prompt(precentSellMargin).then(answers => {
        sellMargin = Number(answers.marginSell)/100;
        console.log("Sell margin is: " + sellMargin*100 + "%");
        setBuyMargin();
    });        
}

function setBuyMargin(){
    console.log();
    console.log("What precentage would you like to sell at?");
    inquirer.prompt(precentBuyMargin).then(answers => {
        buyMargin = Number(answers.marginBuy)/100;
        console.log("Sell margin is: " + buyMargin*100 + "%");
        confirmOrder();
    });        
}
//This prompt will print the order details on the command line and then ask if you would like to proceed with the trade

var wasItConfirmed = false;

function confirmOrder(){
    console.log();
    console.log("==================== Details of your trade below ====================");
    console.log();
    console.log(chalk.yellow(".................... Trade Type: ") + chalk.green.bold(orderSide) + chalk.yellow(" ...................."));
    console.log(chalk.yellow(".................... " + orderSide + " at:     ")+ chalk.green.bold(tradePrice + " USD") + chalk.yellow(" ...................."));
    console.log(chalk.yellow(".................... Trade size: ") + chalk.green.bold(tradeSize + " " + currencyType) + chalk.yellow(" ...................."));
    console.log(chalk.yellow(".................... Estimated fee in " + currencyType + ": ") + chalk.green.bold(estimatedFee) + chalk.yellow(" ...................."));
    console.log(chalk.yellow(".................... Estimated fee in USD: ") + chalk.green.bold(estimatedUSDFee) + chalk.yellow(" ...................."));
    console.log(chalk.yellow(".................... Sell margin: ") + chalk.green.bold(sellMargin*100 + "%") + chalk.yellow(" ...................."));
    console.log(chalk.yellow(".................... Buy margin: ") + chalk.green.bold(buyMargin*100 + "%") + chalk.yellow(" ...................."));
    console.log();
    inquirer.prompt(areYouSure).then(answers => {
        if(answers.confirm === "yes"){
            wasItConfirmed = true;
            placeOrder();
        }
        else{
            return;
        }
    }); 
}

//This function will place the order using the information provided by the previous prompts

function placeOrder(){
    if(wasItConfirmed === true){ //Sort of a middleware to keep the program from placing order if the user did not confirm it
        if(isBuy === true){
            authedClient.buy({price: tradePrice, size: tradeSize, product_id: currencyType + '-USD'}, (error, response, data) =>{
                if (error) {
                    console.log(error);
                    return;
                } else {
                    console.log("Trade made =========================");
                    console.log(data)
                    timeCreated = data.created_at;
                    tradeID = data.id;
                    saveTradeInfoToTXT();
                    console.log("New Trade ID: " + tradeID);
                    tradesCompleted = tradesCompleted + 1;
                    trackProductOrder();
                }
            });
        }
        else{
            authedClient.sell({price: tradePrice, size: tradeSize, product_id: currencyType + '-USD'}, (error, response, data) =>{
                if (error) {
                    console.log(error);
                    return;
                } else {
                    console.log("Trade made =========================");
                    console.log(data)
                    timeCreated = data.created_at;
                    tradeID = data.id;
                    saveTradeInfoToTXT();
                    console.log("New Trade ID: " + tradeID);
                    tradesCompleted = tradesCompleted + 1;
                    trackProductOrder();
                }
            });
        }
    }
    else{ //If there was an error with trying to comfirm the trade then this message will be sent and the program will end
        console.log(chalk.bgRed("There was an error with trying to confirm the trade"));
        console.log("Please try again");
        return;
    }
}

//Keeping track of the current order

function getTradeInfo(){
    authedClient.getOrder(tradeID, (error, response, data) =>{
        if (error) {
            console.log(error);
        } else {
            tradePrice = data.price;
        }
        trackProductOrder();
    });  
}  

var isSettled = Boolean; //A boolean to keep track of whether or not a trade has been completed

//This funciton finds the current trade

function getProductOrder(){
  authedClient.getOrder(tradeID, (error, response, data) =>{
        if (error) {
            console.log(error);
        } else {
            isSettled = data.settled;
        }
  });    
}

//This funciton has a setInterval in it. Every second it will run through multiple functions. These functions are keeping track of the 
//currenct trade. If the current trade is completed it will run the newTrade function, which will place a buy or sell trade at a rate
//based off of the previous trade.

var tradesCompleted = 0;
var currentPrice = "";

function trackProductOrder(){setInterval(function(){
    publicClient.getProductTicker(currencyType + '-USD', (error, response, data) => {
        if (error) {
            console.log(error);
            clearInterval(); //If an error has occurred the setInterval will stop
            return;
        } else {
            timeKeeper(); //Keeps track of the amount of time the program has been running
            if(isSettled === true){ //If trade is completed a new trade will be created
                console.log("Is trade settled? " + isSettled);
                console.log("Old Trade ID: " + tradeID);
                console.log("Old Price: " + tradePrice);
                console.log("Making new trade ------------------------")
                newTrade();
            }
            else{ //This part of the funciton displays the current value of the crypto, if trade is settled, what price it will buy or sell, number of trades completed, and the amount time passed
                getProductOrder();
                console.log(chalk.yellowBright("Current Price: " + Number(data.price).toFixed(2) + " ") +  
                chalk.blueBright(" (Is settled: " + isSettled + ") ") + chalk.green.bold(orderSide + " at: " + tradePrice)
                    + chalk.rgb(255, 165, 0)(" Trades completed: " + tradesCompleted) + " Time past: " + hours 
                    + ":" + minutes + ":" + seconds);                
            }
        }
    });
}, 1000)}

//This funciton keeps track of the amount of time that the program has been running for

var seconds = 0;
var minutes = 0;
var hours = 0;

function timeKeeper(){
    if(seconds >= 60){
        seconds = 0;
        minutes = minutes + 1        
        if(minutes >= 60){
            minutes = 0;
            hours = hours + 1;
        }
    }
    else{
        seconds = seconds + 1;	
    }
}

//This funciton creates a new trade. If the previous trade was a buy trade then this function will create a sell trade, and vice versa
//The trade price is created from taking the previous trade price multipled by the margin, then either subtracting that number from the 
//previous price (sell) or adding it to the previous price (buy). 

var timeCreated = "";

function newTrade(){
    if(orderSide === "buy"){
        tradePrice = Math.round((tradePrice + (tradePrice*sellMargin))*100)/100;
        console.log("New Price: " + tradePrice);
        orderSide = "sell";
        authedClient.sell({price: Number(tradePrice), size: tradeSize, product_id: currencyType + '-USD'}, (error, response, data) =>{
            if (error) {
                console.log(error);
                return;
            } else {
                console.log("Trade made =========================");
                console.log(data);
                timeCreated = data.created_at;
                tradeID = data.id;
                tradeFunctions();
            }
        });
    }else{
        if(orderSide === "sell"){
            tradePrice = Math.round((tradePrice - (tradePrice*buyMargin))*100)/100;
            console.log("New Price: " + tradePrice);
            orderSide = "buy";
            authedClient.buy({price: Number(tradePrice), size: tradeSize, product_id: currencyType + '-USD'}, (error, response, data) =>{
                if (error) {
                    console.log(error);
                    return;
                } else {
                    console.log("Trade made =========================");
                    console.log(data);
                    timeCreated = data.created_at;
                    tradeID = data.id;
                    tradeFunctions();
                }
            });  
        }  
    }
}

//This funciton is here to reduce the amount of redundant code in the newTrade function

function tradeFunctions(){
    saveTradeInfoToTXT();
    console.log("New Trade ID: " + tradeID);
    isSettled = false;
    tradesCompleted = tradesCompleted + 1;
    trackProductOrder();
}

//This funciton saves the information of the new trade to a text file. The text file will have the data of the trade in it's title

function saveTradeInfoToTXT(){
    findDate();
    fs.appendFile('trades/trade_' + todaysDate + '.txt',  "========================================"
    + '\r\n' + "New " + orderSide +  " trade crated at: " + timeCreated 
    + '\r\n' + "Trade ID: " + tradeID + '\r\n' + "Price: " + tradePrice + " USD" + '\r\n' + "Size: " + tradeSize + " " + currencyType 
    + '\r\n' + "========================================", (error, response, data) => {
      if (error) {
        console.log(error);
      } 
    }); 
  }

//This function finds the current data of the trade. This current data will be used in the name of the text file

var todaysDate = "";

function findDate(){
    todaysDate = "";
    for(var i = 0; i < timeCreated.length; i++){
        var text = timeCreated[i];
        if(text === "T"){
            i = timeCreated.length;
        }
        else{
            todaysDate = todaysDate + text;
        }
    }
}

main();