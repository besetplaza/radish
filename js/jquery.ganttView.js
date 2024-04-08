/*
jQuery.ganttView v.0.8.8
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies
*/

/*
Options
-----------------
showWeekends: boolean
data: object
cellWidth: number
cellHeight: number
slideWidth: number
dataUrl: string
behavior: {
	clickable: boolean,
	draggable: boolean,
	resizable: boolean,
	onClick: function,
	onDrag: function,
	onResize: function
}
*/

(function (jQuery) {
	jQuery.fn.ganttView = function () {
		var args = Array.prototype.slice.call(arguments);

		if (args.length == 1 && typeof(args[0]) == "object") {
			build.call(this, args[0]);
		}

		if (args.length == 2 && typeof(args[0]) == "string") {
			handleMethod.call(this, args[0], args[1]);
		}
	};

	function build(options) {

		//左右パディング5ずつと、日付と人の列幅97と、枠線1*3本を引いた全体幅をグリッドの幅とする
		let slideWidth = $("body").prop("offsetWidth") - 100;

		var els = this;
		var defaults = {
			slideWidth: slideWidth,
			cellWidth: slideWidth / (11 * 2),	//11時間分(30分刻みなので*2)=11*2
		};

		var opts = jQuery.extend(true, defaults, options);

		if (opts.data) {
			build();
		} else if (opts.dataUrl) {
			jQuery.getJSON(opts.dataUrl, function (data) { opts.data = data; build(); });
		}

		function build() {

			//var minDays = Math.floor((opts.slideWidth / opts.cellWidth) + 5);
			//var minDays = opts.cellWidth;

			//データの一番上の開始日を取得、なければ現在日
			var dt = new Date();
			if (0 < opts.data.length) {
				if (0 < opts.data[0].series.length) {
					dt = new Date(opts.data[0].series[0].start);
				}
			}
			//console.log("dt:" + dt.toLocaleString('ja'));

			var y = dt.getFullYear();
			var m = dt.getMonth();
			var d = dt.getDate();

			//9時から20時までの決め打ち
			opts.start = new Date(y, m, d, 9, 0);
			opts.end = new Date(y, m, d, 20, 0);

			els.each(function () {

				var container = jQuery(this);
				var div = jQuery("<div>", { "class": "ganttview" });
				new Chart(div, opts).render();
				container.append(div);

				var w = jQuery("div.ganttview-vtheader", container).outerWidth() +
					jQuery("div.ganttview-slide-container", container).outerWidth();
				container.css("width", (w + 2) + "px");

				//Behaviorは削除した
				//new Behavior(container, opts).apply();
			});
		}
	}

	function handleMethod(method, value) {

		if (method == "setSlideWidth") {
			var div = $("div.ganttview", this);
			div.each(function () {
				var vtWidth = $("div.ganttview-vtheader", div).outerWidth();
				$(div).width(vtWidth + value + 1);
				$("div.ganttview-slide-container", this).width(value);
			});
		}
	}

	var Chart = function(div, opts) {

		function render() {
			addVtHeader(div, opts.data, opts.cellHeight);

			var slideDiv = jQuery("<div>", {
				"class": "ganttview-slide-container",
				"css": { "width": opts.slideWidth + "px" }
			});

			dates = getDates(opts.start, opts.end);
			addHzHeader(slideDiv, dates, opts.cellWidth);
			addGrid(slideDiv, opts.data, dates, opts.cellWidth);
			addBlockContainers(slideDiv, opts.data);
			addBlocks(slideDiv, opts.data, opts.cellWidth);
			div.append(slideDiv);
			applyLastClass(div.parent());
		}

		// ベースの開始日時～終了日時を30分毎にして配列にして返す
		function getDates(start, end) {
			var dates = [];
			var last = start.clone();
			dates.push(last);
			while (last.compareTo(end) == -1) {
				//30分毎に追加
				var next = new Date(last.clone().setMinutes(last.getMinutes() + 30));
				dates.push(next);
				last = next;
			}
			return dates;
		}

		//日付背景色クラス取得
		var getDayBackgroundColorClass = function (data) {
			let colorClass = "";
			if (data.series.length) {
				let dt = new Date(data.series[0].start);
				if (DateUtils.isSaturday(dt)) {
					colorClass = "ganttview-block-container-saturday";
				} else if (DateUtils.isSunday(dt)) {
					colorClass = "ganttview-block-container-sunday";
				} else if (DateUtils.isHoliday(dt)) {
					colorClass = "ganttview-block-container-holiday";
				}
			}
			return colorClass;
		}

		// 日付と人のヘッダを作成
		function addVtHeader(div, data, cellHeight) {
			var headerDiv = jQuery("<div>", { "class": "ganttview-vtheader" });
			for (var i = 0; i < data.length; i++) {
				var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
				itemDiv.append(jQuery("<div>", {
					"class": "ganttview-vtheader-item-name",
					"css": { "height": (data[i].series.length * cellHeight) + "px" }
				}).append(data[i].name));

				//日付背景色付け
				$(itemDiv).addClass(getDayBackgroundColorClass(data[i]));

				//日付の配下に人を作成
				var seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
				for (var j = 0; j < data[i].series.length; j++) {
					var series = data[i].series[j];
					let div = seriesDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-series-name" })
						.append(series.name));
				}

				itemDiv.append(seriesDiv);
				headerDiv.append(itemDiv);
			}
			div.append(headerDiv);
		}

		// 年月と時間のヘッダを作成
		function addHzHeader(div, dates, cellWidth) {
			var headerDiv = jQuery("<div>", { "class": "ganttview-hzheader" });
			var monthsDiv = jQuery("<div>", { "class": "ganttview-hzheader-months" });
			var daysDiv = jQuery("<div>", { "class": "ganttview-hzheader-days" });
			var totalW = 0;

			//年月ヘッダ
			let w = (dates.length - 1) * cellWidth;
			let y = dates[0].getFullYear();
			let m = dates[0].getMonth() + 1;
			monthsDiv.append(jQuery("<div>", {
				"class": "ganttview-hzheader-month",
				"css": { "width": (w - 1) + "px" }
			}).append(y + "/" + m));

			//時間ヘッダ
			for (var i = 0; i < (dates.length - 1); i++) {
				//console.log(i + ":" + dates[i]);
				if (dates[i].getMinutes() == 0) {
					daysDiv.append(jQuery("<div>", { "class": "ganttview-hzheader-day", "width": cellWidth - 1 + "px" })	//罫線1を引く
						.append(dates[i].getHours()));
				} else {
					daysDiv.append(jQuery("<div>", { "class": "ganttview-hzheader-day", "width": cellWidth - 1 + "px" }));
				}
			}

			monthsDiv.css("width", w + "px");
			daysDiv.css("width", w + "px");
			headerDiv.append(monthsDiv).append(daysDiv);
			div.append(headerDiv);
		}

		// グリッド線を引く
		function addGrid(div, data, dates, cellWidth) {
			var gridDiv = jQuery("<div>", { "class": "ganttview-grid" });
			var rowDiv = jQuery("<div>", { "class": "ganttview-grid-row" });

			//一行分の要素を作成
			for (var i = 0; i < (dates.length - 1); i++) {
				var cellDiv = jQuery("<div>", { "class": "ganttview-grid-row-cell", "width": cellWidth - 1 + "px" });		//罫線1を引く
				rowDiv.append(cellDiv);
			}

			//月初から月末まで行を追加
			var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * cellWidth;
			rowDiv.css("width", w + "px");
			gridDiv.css("width", w + "px");
			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].series.length; j++) {
					gridDiv.append(rowDiv.clone());
				}
			}
			div.append(gridDiv);
		}

		// ブロックを載せるグリッド範囲
		function addBlockContainers(div, data) {
			var blocksDiv = jQuery("<div>", { "class": "ganttview-blocks" });
			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].series.length; j++) {
					//日付背景色取得
					let colorClass = " " + getDayBackgroundColorClass(data[i]);
					//行追加
					blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" + colorClass}));
				}
			}
			div.append(blocksDiv);
		}

		// データブロックを作成
		function addBlocks(div, data, cellWidth) {
			var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", div);
			var rowIdx = 0;
			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].series.length; j++) {
					let series = data[i].series[j];
					let startDate = new Date(series.start);
					let endDate = new Date(series.end);
					let memo = "";
					if (series.memo) {
						memo = " " + series.memo;
					}

					//開始と終了が同じ場合は次の行へ
					if (startDate.getTime() == endDate.getTime()) {
						rowIdx = rowIdx + 1;
						continue;
					}

					//開始時点は9時
					let startPoint = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 9, 0);

					let size = DateUtils.minutesBetween(startDate, endDate);
					let offset = DateUtils.minutesBetween(startPoint, startDate);

					let workingTime = DateUtils.hoursBetween(startDate, endDate);
					let termTime = toTimeString(startDate) + " - " + toTimeString(endDate);
					let block = jQuery("<div>", {
						"class": "ganttview-block",
						"title": series.name + " " + termTime + " (" + workingTime + "h)",
						"css": {
							"width": ((size * cellWidth) - 9) + "px",
							"margin-left": ((offset * cellWidth) + 3) + "px"
						}
					});

					//ついでに集計
					if (!(series.name in TOTAL)) {
						TOTAL[series.name] = [0, 0];
					}
					TOTAL[series.name][IDX_DAYS_SUM] += 1;				//日数
					TOTAL[series.name][IDX_HOUR_SUM] += workingTime;	//時間

					addBlockData(block, data[i], series);
					setBlockColor(block, j, series);
					if (data[i].series[j].color) {
						block.css("background-color", data[i].series[j].color);
					}
					block.append(jQuery("<div>", { "class": "ganttview-block-text" }).text(termTime + " (" + workingTime + "h)" + memo));
					jQuery(rows[rowIdx]).append(block);
					rowIdx = rowIdx + 1;
				}
			}
		}

		var toTimeString = function (d) {
			var hh = d.getHours();
			var mm = ('0' + d.getMinutes()).slice(-2);
			return hh + ":" + mm;
		}

		var setBlockColor = function (block, j, series) {
			if (series.color) {
				block.css("background-color", series.color);
			} else if (j < Object.keys(BAR_COLOR).length) {
				if (BAR_COLOR[series.name]) {
					block.css("background-color", BAR_COLOR[series.name]);
				} else {
					block.css("background-color", BAR_COLOR["その他"]);
				}
			}
		}

		function addBlockData(block, data, series) {
			// This allows custom attributes to be added to the series data objects
			// and makes them available to the 'data' argument of click, resize, and drag handlers
			var blockData = { id: data.id, name: data.name };
			jQuery.extend(blockData, series);
			block.data("block-data", blockData);
		}

		function applyLastClass(div) {
			jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
			jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
			jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
		}

		return {
			render: render
		};
	}

	var ArrayUtils = {

		contains: function (arr, obj) {
			var has = false;
			for (var i = 0; i < arr.length; i++) { if (arr[i] == obj) { has = true; } }
			return has;
		}
	};

	var DateUtils = {

		minutesBetween: function (start, end) {
			if (!start || !end) { return 0; }
			start = Date.parse(start); end = Date.parse(end);
			if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
			let count = 0, date = start.clone();
			while (date.compareTo(end) == -1) { count = count + 1; date.setMinutes(date.getMinutes() + 30); }
			return count;
		},

		hoursBetween: function (start, end) {
			if (!start || !end) { return 0; }
			start = Date.parse(start); end = Date.parse(end);
			if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
			let count = 0.0, date = start.clone();
			while (date.compareTo(end) == -1) { count = count + 1; date.setHours(date.getHours() + 1); }
			if (date.getTime() != end.getTime()) { count = count - 0.5; }
			return count;
		},

		isWeekend: function (date) {
			return date.getDay() % 6 == 0;
		},

		isSaturday: function (date) {
			return date.getDay() == 6;
		},

		isSunday: function (date) {
			return date.getDay() == 0;
		},

		isHoliday: function (date) {
			for (var i = 0; i < HOLIDAYS.length; i++) {
				if (HOLIDAYS[i].year == date.getFullYear()) {
					for (var j = 0; j < HOLIDAYS[i].holiday.length; j++) {
						let dateHoliday = new Date(HOLIDAYS[i].holiday[j].date);
						if (dateHoliday.toLocaleDateString() == date.toLocaleDateString()) return true;
					}
				}
			}
			return false;
		},
	};

})(jQuery);