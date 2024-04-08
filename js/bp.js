const BAR_COLOR = {
	"政井"  :"#ffffd1", 
	"澤田"  :"#e0ffff", 
	"是石"  :"#ffe0ff", 
	"久保田":"#e5ffcc", 
	"新谷"  :"#eddbff", 
	"吉田"  :"#ffe5cc", 
	"その他":"#dbffed", 
};

//変数名は文字列結合で宣言できないためあらかじめ定義
const DATA_FILE_NAME = {
	202311: ganttData202311,
	202312: ganttData202312,
	202401: ganttData202401,
	202402: ganttData202402,
	202403: ganttData202403,
	202404: ganttData202404,
//	202405: ganttData202405,
//	202406: ganttData202406,
//	202407: ganttData202407,
//	202408: ganttData202408,
//	202409: ganttData202409,
//	202410: ganttData202410,
//	202411: ganttData202411,
//	202412: ganttData202412,
};

//新着情報
const INFORMATION = [
	{ day: "2024.04.08", isNew: true, text: "澤田さん店舗のシフトを追加しました。" },
	{ day: "2024.02.24", isNew: false, text: "4日に新谷さん9時半～13時で追加しました。" },
	{ day: "2024.03.22", isNew: false, text: "2024年4月のシフトを追加しました。" },
	{ day: "2024.03.09", isNew: false, text: "16日の政井さん削除しました。" },
	{ day: "2024.03.04", isNew: false, text: "3月のカフェカレンダー追加しました。" },
	{ day: "2024.03.02", isNew: false, text: "26日の是石さん削除しました。でも入れたら15時から入ります。" },
	{ day: "2024.02.24", isNew: false, text: "11日の新谷さん15時までに修正しました。" },
	{ day: "2024.02.24", isNew: false, text: "2024年3月のシフトを追加しました。" },
	{ day: "2024.02.02", isNew: false, text: "2月のカフェカレンダー追加しました。" },
	{ day: "2024.01.26", isNew: false, text: "2日の是石さん16時までに修正しました。" },
	{ day: "2024.01.26", isNew: false, text: "2024年2月のシフトを追加しました。" },
	{ day: "2024.01.06", isNew: false, text: "16日の是石さん削除しました。でも日中入れたら入ります。" },
	{ day: "2023.12.24", isNew: false, text: "12、19日の新谷さん15時までに修正しました。" },
	{ day: "2023.12.22", isNew: false, text: "29、31日の吉田さん19時までに修正しました。" },
	{ day: "2023.12.22", isNew: false, text: "22、23、29日の是石さん19時までに修正しました。" },
	{ day: "2023.12.21", isNew: false, text: "2024年1月のシフトを追加しました。" },
];

//他に表示するファイルのパス
const DATA_FILE_PATH = [
	{ "yyyymm": 202311, "excel": "", "calendar": "" },
	{ "yyyymm": 202312, "excel": "data/202312.xlsx", "cafe": "image/202312-cafe-calendar.jpg" },
	{ "yyyymm": 202401, "excel": "data/202401.xlsx", "cafe": "" },
	{ "yyyymm": 202402, "excel": "data/202402.xlsx", "cafe": "image/202402-cafe-calendar.jpg" },
	{ "yyyymm": 202403, "excel": "data/202403.xlsx", "cafe": "image/202403-cafe-calendar.jpg" },
	{ "yyyymm": 202404, "excel": "data/202404.xlsx", "cafe": "" },
//	{ "yyyymm": 202405, "excel": "data/202405.xlsx", "cafe": "image/202405-cafe-calendar.jpg" },
//	{ "yyyymm": 202406, "excel": "data/202406.xlsx", "cafe": "image/202406-cafe-calendar.jpg" },
//	{ "yyyymm": 202407, "excel": "data/202407.xlsx", "cafe": "image/202407-cafe-calendar.jpg" },
//	{ "yyyymm": 202408, "excel": "data/202408.xlsx", "cafe": "image/202408-cafe-calendar.jpg" },
//	{ "yyyymm": 202409, "excel": "data/202409.xlsx", "cafe": "image/202409-cafe-calendar.jpg" },
//	{ "yyyymm": 202410, "excel": "data/202410.xlsx", "cafe": "image/202410-cafe-calendar.jpg" },
//	{ "yyyymm": 202411, "excel": "data/202411.xlsx", "cafe": "image/202411-cafe-calendar.jpg" },
//	{ "yyyymm": 202412, "excel": "data/202412.xlsx", "cafe": "image/202412-cafe-calendar.jpg" },
];


//集計表
//キー(string)：人、値(array(number))：[0]=日数合計/[1]=時間合計
var TOTAL = {};
const IDX_DAYS_SUM = 0;
const IDX_HOUR_SUM = 1;

$(function () {

	//画面回転判定用
	let lastWidth = window.innerWidth;

	//エクセルファイルパス取得
	const getExcelPath = function (yyyymm) {
		return "data/" + yyyymm + ".xlsx";
	}

	//カフェカレンダーファイルパス取得
	const getCafeCalendarPath = function (yyyymm) {
		return "image/" + yyyymm + "-cafe-calendar.jpg"
	}

	//ファイルが存在すればcallback
	const setExistsFilePath = function(yyyymm, kind, callback) {
		let path = "";
		//ファイル存在チェック
		DATA_FILE_PATH.forEach(function(element){
			if (element.yyyymm == yyyymm) {
				if (kind == "excel") {
					path = element.excel;
				} else if (kind == "cafe") {
					path = element.cafe;
				}
				return;
			}
		});
		if (path) {
			callback(yyyymm, path);
		}
	}

	//画面回転イベント
	$(window).on("orientationchange resize", function() {
		if (lastWidth != window.innerWidth) {
			lastWidth = window.innerWidth;
			$("#target_month").trigger("change");
		}
	});

	//年月コンボ変更イベント
	$("#target_month").on("change", function() {
		//初期化 ガントチャート
		$("#ganttChart").children().remove();

		//初期化 エクセルボタン設定
		$("#export").attr("href", "javascript: alert('今月のエクセルはありません。');");

		//初期化 集計表設定
		TOTAL = {};
		$("#totalTable").children().remove();

		//初期化 カフェカレンダー設定
		$("#cafeCalendar").attr("src", null);
		$("#cafeCalendar").attr("alt", "今月のカレンダーはありません。");

		//使用する変数を選択し再描画
		if (DATA_FILE_NAME[this.value]) {
			$("#ganttChart").ganttView({ data: DATA_FILE_NAME[this.value] });
		}

		if (this.value) {
			//エクセルボタン設定
			const callbackExistsFileExcel = function(yyyymm, url) {
				$("#export").attr("href", url);
				$("#export").attr("download", yyyymm + "シフト表.xlsx");
			}
			setExistsFilePath(this.value, "excel", callbackExistsFileExcel);

			//カフェカレンダー設定
			const callbackExistsFileCafeCalendar = function(yyyymm, url) {
			console.log("url[" + url);
				$("#cafeCalendar").attr("src", url);
				$("#cafeCalendar").attr("alt", "今月の営業日");
			}
			setExistsFilePath(this.value, "cafe", callbackExistsFileCafeCalendar);

			//集計表設定
			$("#totalTable").children().remove();
			Object.keys(TOTAL).forEach( function(value) {
				$("#totalTable").append("<tr>");
				$("#totalTable").append("<td>" + value + "</td>");
				$("#totalTable").append("<td>" + TOTAL[value][IDX_DAYS_SUM] + "&nbsp;日</td>");
				$("#totalTable").append("<td>" + TOTAL[value][IDX_HOUR_SUM] + "&nbsp;h</td>");
				$("#totalTable").append("</tr>");
			});
		}
	});

	//新着情報ボタン押下イベント
	$("#info").click(function() {
		$("#modalInfDlg").children().remove();
		$("#modalInfDlg").append("<ul>");
		Object.keys(INFORMATION).forEach( function(index) {
			let line = INFORMATION[index];
			let $li = $("<li>");
			$li.append("<div class='day'>" + line.day + "</div>");
			$li.append("<div class='label" + (line.isNew ? " new" : "") + "'></div>");
			$li.append("<div class='text'>" + line.text + "</div>");
			$("#modalInfDlg>ul").append($li);
		});

		$("#modalInfDlg").dialog({
			modal: true,
			width: 320,
			height: 320,
			title: "新着情報",
			buttons: {
				"閉じる": function() {
					$(this).dialog("close");
				}
			},
			position: {
				my: "center top",
				at: "center top+" + ($(window).scrollTop() + $(".header").height()) + "px",
				of: "div.main",
			},
		});
	});

	//カフェボタン押下イベント
	$("#cafe").click(function() {
		$("#modalImgDlg").dialog({
			modal: true,
			width: 240,
			buttons: {
				"閉じる": function() {
					$(this).dialog("close");
				}
			},
			open: function(event, ui) {
				$("[aria-describedby='modalImgDlg'] .ui-dialog-titlebar").removeClass("ui-widget-header");
			},
			position: {
				my: "center top",
				at: "center top+" + ($(window).scrollTop() + $(".header").height()) + "px",
				of: "div.main",
			},
		});
	});

	//集計ボタン押下イベント
	$("#total").click(function() {
		let dialogTitle = "";
		let yyyymm = $("#target_month option:selected").text();
		if (yyyymm) {
			dialogTitle = yyyymm + "の集計表";
		}

		$("#modalSumDlg").dialog({
			modal: true,
			width: 240,
			title: dialogTitle,
			buttons: {
				"閉じる": function() {
					$(this).dialog("close");
				}
			},
			position: {
				my: "center top",
				at: "center top+" + ($(window).scrollTop() + $(".header").height()) + "px",
				of: "div.main",
			},
		});
	});

	//年月コンボ初期値設定
	{
		//選択肢を作成
		$("#target_month").children().remove();
		Object.keys(DATA_FILE_NAME).reverse().forEach(function(key) {
			let yyyymm = key;
			let yyyy = key.substring(0, 4);
			let mm = key.substring(4, 6);
			let $option = $("<option>").val(yyyymm).text(yyyy + "年" + mm + "月");
			$("#target_month").append($option);
		});

		//最新年月を選択
		$("#target_month").prop("selectedIndex", 0);

		//選択年月で表の描画
		$("#target_month").trigger("change");
	}
});
