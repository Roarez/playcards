var readline = require('readline');
var request = require('request');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var options = {
    url: 'http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1',
    method: 'get'
}

var newDeck;

function newGame(callback) {
    options.url = 'http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1',
    request(options, function(error, response, body) {
        if (error) callback(error);
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            newDeck = info.deck_id;
            console.log("New game");
            callback();
        }
    });
}

function draw(deck, nCards, chand, callback) {
    options.url = 'http://deckofcardsapi.com/api/deck/'+deck+'/draw/?count='+nCards;
    request(options, function(error, response, body) {
        if (error) callback(error);
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            info.cards.forEach(function(card) {
                if(chand.length <= 5)
                    chand.push(card.code);
                //console.log('Card: ' + card.code);
            });
            callback(null, chand);
        }
    });
}

function discard(deck, pile, cards, cohand, callback) {
    var concatCards = '';
    for(var i = 0; i < cards.length; i++) {
        for(var c = 0; c < cohand.length; c++) {
            if(cards[i] === cohand[c])
                cohand.splice(c, 1);
        }
        if(concatCards.length > 0)
            concatCards += ','+ cards[i];
        else
            concatCards += cards[i];
    }
    options.url = 'http://deckofcardsapi.com/api/deck/'+deck+'/pile/'+pile+'/add/?cards='+concatCards;
    request(options, function(error, response, body) {
        if (error) callback(error);
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            callback(null, cohand);
            console.log('Cards discarded: ' + info.piles[pile].remaining);
        }
    });
}

var pd;

function customDeck(cards, callback) {
    var concatCards = '';
    for(var i = 0; i < cards.length; i++) {
        if(concatCards.length > 0)
            concatCards += ','+ cards[i];
        else
            concatCards += cards[i];
    }
    options.url = 'http://deckofcardsapi.com/api/deck/shuffle/?cards='+concatCards;
    request(options, function(error, response, body) {
        if (error) callback(error);
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            pd = deck_id;
            console.log('New deck with: ' + info.remaining + ' cards');
            callback();
        }
    });
}

function rateHand(hand) {
    var rating = [
        {name: 'Royal Flush', rate: 9, check: isRoyalFlush(hand)},
        {name: 'Straight Flush', rate: 8, check: isStraightFlush(hand)},
        {name: 'Four of a Kind', rate: 7, check: isFourOfKind(hand)},
        {name: 'Full House', rate: 6, check: isFullHouse(hand)},
        {name: 'Flush', rate: 5, check: isFlush(hand)},
        {name: 'Straight', rate: 4, check: isStraight(hand)},
        {name: 'Three of a Kind', rate: 3, check: isThreeOfKind(hand)},
        {name: 'Two Pairs', rate: 2, check: isTwoPair(hand)},
        {name: 'One Pair', rate: 1, check: isPair(hand)},
    ];
    var handRate = {};
    for(var i = 0; i < rating.length; i++) {
        if(rating[i].check) {
            handRate.name = rating[i].name;
            handRate.rate = rating[i].rate;
            return handRate;
        }
    }
    if(handRate.name === undefined) {
        handRate.name = 'High Card';
        handRate.rate = 0;
    }
    return handRate;
    /*card codes
                A  K  Q  J  0  9  8  7  6  5  4  3  2
    Hearts      AH KH QH JH 0H 9H 8H 7H 6H 5H 4H 3H 2H
    Spades      AS KS QS JS 0S 9S 8S 7S 6S 5S 4S 3S 2S
    Diamonds    AD KD QD JD 0D 9D 8D 7D 6D 5D 4D 3D 2D
    Clubs       AC KC QC JC 0C 9C 8C 7C 6C 5C 4C 3C 2C
    */
}

function hasRepeats(num, hand) {
    var values = [];
    hand.forEach(function(card) {
        var sep = card.split('');
        values.push(sep[0]);
    });
    values.sort();
    for(var i = 0; i < values.length -num; i++) {
        if(values[i] === values[i+num])             //idea: could try cut the first repeats out of the array
            return true;
    }
    return false;
}

function isPair(hand) {
    return hasRepeats(1, hand);
}

function isTwoPair(hand) { // more than one repeat method needed
    var values = [];
    hand.forEach(function(card) {
        var sep = card.split('');
        values.push(sep[0]);
    });
    values.sort();
    var pairs = [];
    for(var i = 0; i < values.length -1; i++) {
        if(values[i] === values[i+1])
            pairs.push(values[i]);
    }
    if(pairs.length === 2)
        return true;
    else
        return false;
}

function isThreeOfKind(hand) {
    return hasRepeats(2, hand);
}

function isFullHouse(hand) { // more than one repeat method needed
    var values = [];
    hand.forEach(function(card) {
        var sep = card.split('');
        values.push(sep[0]);
    });
    values.sort();
    var threeValue, foundOne = false;
    for(var i = 0; i < values.length -2; i++) { // find three of a kind part of the fullhouse
        if(values[i] === values[i+2]) {
            threeValue = values[i];
            foundOne = true;
        }
    }
    if(foundOne) {
        for(var i = 0; i < values.length -1; i++) { // find pair part of the fullhouse
            if(values[i] === values[i+1])
                if(values[i] !== threeValue) // value from three of a kind must be exeption
                    return true;
        }
    }
    return false;
}

function isFourOfKind(hand) {
    return hasRepeats(3, hand);
}

function isStraight(hand) {
    var values = [];
    hand.forEach(function(card) {
        var sep = card.split('');
        values.push(sep[0]);
    });
    // Order: A J K Q 0 2 3 4 5 6 7 8 9
    var sorted = sortHelp(values);
    sorted.reverse();
    var count = 1;
    for(var i = 0; i < sorted.length -1; i++) {
        if(sorted[i] === (sorted[i+1]-1))
            count++;
    }
    if(count === 5)
        return true;
    else
        return false;
}

function isStraightFlush(hand) {
    return isStraight(hand) && isFlush(hand);
}

function sortHelp(arr) {
    var arr2 = [];
    for(var i = 0; i < arr.length; i++) {
        if(arr[i] === 'A') {arr2.push(14); arr2.push(1);} // what to do in case of A being 1?
        if(arr[i] === 'K') {arr2.push(13);}
        if(arr[i] === 'Q') {arr2.push(12);}
        if(arr[i] === 'J') {arr2.push(11);}
        if(arr[i] === '0') {arr2.push(10);}
        if(arr[i] === '9') {arr2.push(9);}
        if(arr[i] === '8') {arr2.push(8);}
        if(arr[i] === '7') {arr2.push(7);}
        if(arr[i] === '6') {arr2.push(6);}
        if(arr[i] === '5') {arr2.push(5);}
        if(arr[i] === '4') {arr2.push(4);}
        if(arr[i] === '3') {arr2.push(3);}
        if(arr[i] === '2') {arr2.push(2);}
    }
    arr2.sort(function(a,b){return b - a});
    return arr2;
}

function isFlush(hand) {
    var suits = [];
    hand.forEach(function(card) {
        var sep = card.split('');
        suits.push(sep[1]);
    });
    return suits.every(function(element) {
        return element === suits[1];
    });
}

function isRoyalFlush(hand) {
    var values = [];
    hand.forEach(function(card) {
        var sep = card.split('');
        values.push(sep[0]);
    });
    var sorted = sortHelp(values);
    sorted.reverse();
    var sf = isStraightFlush(hand);
    if(sf && (sorted.length === 6))    //narrowed down 2 cases 1-5 and 10-14
        if(sorted[1] === 10)
            return true;
    return false;
}

function highCard(hand) {
    var values = [];
    hand.forEach(function(card) {
        var sep = card.split('');
        values.push(sep[0]);
    });
    var sorted = sortHelp(values);
    return sorted[0]; //first entry = highest value
}

function playPoker() {
    newGame(function(error) {
        if (error) throw error;
        draw(newDeck, 5, [], function(err, pHand) {
            var hand = pHand;
            console.log(hand);
            rl.question("What cards do you wish to discard? (leave empty for none) ", function(answer) {
                if(answer.length === 0) {
                    hand = [];
                    draw(newDeck, 5, hand, function(err, aiHand) {
                        console.log('Your hand: ', pHand);
                        console.log('AI hand: ', aiHand);
                        var pRating = rateHand(['AS','0S','QS','KS','JS']);
                        var aiRating = rateHand(aiHand);
                        console.log('You got a', pRating.name);
                        console.log('AI got a', aiRating.name);
                        if(pRating.rate > aiRating.rate) {
                            console.log('You Won!');
                        }
                        else if(pRating.rate < aiRating.rate) {
                            console.log('You Lost');
                        }
                        else {
                            var pHigh = highCard(pHand);
                            var aiHigh = highCard(aiHand);
                            if(pHigh > aiHigh)
                                console.log('You Won!');
                            else if(pHigh < aiHigh)
                                console.log('You Lost');
                            else
                                console.log('Its a Draw');
                        }
                        //rate hands & decide winner
                    }); //competing AI hand (random for now)
                }
                else {
                    var disCards = answer.split(' ');
                    console.log(disCards);
                    discard(newDeck, 'discardedCards', disCards, hand, function(error, dcHand) {
                        draw(newDeck, disCards.length, dcHand, function(err, npHand) {
                            hand = [];
                            draw(newDeck, 5, hand, function(err, aiHand) {
                                console.log('Your hand: ', npHand);
                                console.log('AI hand: ', aiHand);
                                var pRating = rateHand(npHand);
                                var aiRating = rateHand(aiHand);
                                console.log('You got a ', pRating.name);
                                console.log('AI got a ', aiRating.name);
                                if(pRating.rate > aiRating.rate) {
                                    console.log('You Won!');
                                }
                                else if(pRating.rate < aiRating.rate) {
                                    console.log('You Lost');
                                }
                                else {
                                    var pHigh = highCard(npHand);
                                    var aiHigh = highCard(aiHand);
                                    if(pHigh > aiHigh)
                                        console.log('You Won!');
                                    else if(pHigh < aiHigh)
                                        console.log('You Lost');
                                    else
                                        console.log('Its a Draw');
                                }

                                //rate hands & decide winner
                            }); //competing AI hand (random for now)
                        }); // draw equal number of discarded cards
                    });
                }
                // make hand rating system, rate both player and AI hands and return winner

                rl.close();
            }); //five card draw poker
        });
    });
}

playPoker();
// make a function for each option, then make Interface to choose between options