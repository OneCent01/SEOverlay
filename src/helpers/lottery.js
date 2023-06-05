import {runTimer} from './timer.js';
import {initLotteryData} from './sessionState.js';
import {STREAMER} from './consts.js';

const timerPromise = (sessionData, seconds) => new Promise((resolve) => {
	runTimer(sessionData, {
		seconds, 
		onComplete: resolve,
		canvas: sessionData.lottery.timer.canvas
	});
});

let hideTimeout = null;

export const runLottery = async (sessionData, seconds) => new Promise(async (resolve) => {
	let isSkipped = false;
	sessionData.lottery = initLotteryData();
	sessionData.lottery.timer.container.style.opacity = '1';
	const runningLotteryContainer = document.getElementById('running_lottery');
	const lotteryResultsContainer = document.getElementById('lottery_results');
	const lotterResultsList = document.getElementById('lottery_winners_container');
	
	sessionData.lottery.skip = () => {
		runningLotteryContainer.style.opacity = '0';
		lotteryResultsContainer.style.opacity = '0';
		sessionData.lottery.timer.container.style.opacity = '0';
		sessionData.lottery.isOpen = false;
		isSkipped = true;
		sessionData.lottery.skip = null;
		resolve();
		return;
	}

	lotteryResultsContainer.style.opacity = '0';
	runningLotteryContainer.style.display = 'block';
	runningLotteryContainer.style.opacity = '1';

	sessionData.lottery.isOpen = true;

	let isDone = false;

	while(!isDone) {
		await timerPromise(sessionData, seconds);
		if(sessionData.lottery.users.size >= 4) {
			isDone = true;
		}
		if(isSkipped) {
			resolve();
			return;
		}
	};
	// there's 4 or more users in the lottery, select them NOW!!
	const usersInPool = sessionData.lottery.users.size;
	while(sessionData.lottery.winners.length < Math.min(4, usersInPool)) {
		const randomUserIndex = Math.floor(Math.random() * sessionData.lottery.users.size);
		const usersArray = [...sessionData.lottery.users];
		const selectedUser = usersArray[randomUserIndex];
		sessionData.lottery.users.delete(selectedUser);
		sessionData.lottery.winners.push(selectedUser);
	}

	Array.from(lotterResultsList.children).map((child, i) => {
		const winnerUserId = sessionData.lottery.winners[i];
		const winner = sessionData.users[winnerUserId];
		child.innerHTML = winner?.display_name || '';
	})

	runningLotteryContainer.style.opacity = '0';
	lotteryResultsContainer.style.opacity = '1';

	hideTimeout = setTimeout(() => {
		if(isSkipped) {
			resolve();
			return;
		}
		sessionData.lottery.timer.container.style.opacity = '0';
		sessionData.lottery.isOpen = false;
		sessionData.lottery.skip = null;
		resolve();
	}, 20000);
});