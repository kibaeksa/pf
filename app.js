const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
const util = require('util');
const promisify = util.promisify;
const MongoClient = require('mongodb').MongoClient;
const testUrl = 'mongodb://localhost:27017/mydb';
const PORT = process.env.PORT || 3000;

// MongoClient.connect(testUrl , (err , db) => {
//     if(err) throw err;
//     console.log('connected');
//     // db.createCollection('customers' , (err , res) => {
//     //     if(err) throw err;
//     //     console.log('Collection created!');
//     //     db.close();
//     // });
// });


const errorString = `
    <div style="padding:200px 0;text-align: center;">
        <p style="margin-bottom:10px;font:60px/60px 'FuturaStd Condensed" ,helvetica,arial,sans-serif';color:#64c7c3;"="">404 ERROR</p>
        <p style="font:32px/32px 'Noto Sans KR Medium';color:#000;">페이지가 없습니다.</p>
    </div>
`;

const deliveryString = `
    <div id="dr-info-wrap"><div class="dr-info-box"><div class="dr-info-title"><h2>배송안내</h2></div><div class="dr-info-desc"><div class="dr-info-decs_01"><h3>배송기간</h3><ul><li>배송은 결제 확인일로부터 주중에는 5일이내에 배송해 드립니다.</li><li>단, 주말/공휴일의 경우 또는 도서 산간지역의 경우 1~2일 더 소요될 수 있습니다.</li><li>배송진행 사항은 마이페이지 &gt; 주문배송조회에서 확인 하실 수 있습니다.</li></ul></div><div class="dr-info-decs_02"><h3>배송비</h3><ul><li>총 구매금액 4만원 이상 무료배송</li><li>4만원 미만 주문 시 배송비 2,500원이 부과됩니다.</li></ul></div></div></div><div class="dr-info-box"><div class="dr-info-title"><h2>반품안내</h2></div><div class="dr-info-desc"><div class="dr-info-decs_00"><h3 class="dt-hidden">반품안내</h3><ul><li>반품은 배송일로부터 7일이내에 신청해 주십시오.</li><li>반품은 [로그인 &gt; 마이페이지 &gt; 주문취소/반품 조회] 페이지에서 신청해 주셔야 합니다.</li><li>고객 단순변심에 의한 반품 시 왕복 배송비를 부담하셔야 합니다.</li><li>반품시에는 지정된 택배사를 통해서만 가능합니다.</li><li>반품 주소지는 배송박스를 참조해 주세요.</li></ul></div><div class="dr-info-decs_01"><h3>반품이 가능한 경우</h3><ul><li>단순 변심, 착오 구매에 따른 교환/반품은 상품을 공급받은 날부터 7일 이내에 가능합니다. (왕복 배송비는 소비자 부담)</li><li>단, 일부 제품의 경우 포장을 개봉하였거나 포장이 훼손되어 상품가치가 상실된 경우에는 반품이 불가능합니다.<br />(상품 확인을 위하여 포장 훼손한 경우는 제외)</li><li>공급 받으신 상품 내용이 표시, 광고내용과 다르거나 다르게 이행된 경우에는 그 상품을 공급받은 날부터 3개월 이내,</li><li>그 사실을 안 날 또는 알 수 있었던 날부터 30일 이내 청약철회가 가능합니다.</li></ul></div><div class="dr-info-decs_02"><h3>반품이 불가능한 경우</h3><ul><li>반품요청기간이 지난경우</li><li>소비자에게 책임이 있는 사유로 재화등이 멸실되거나 훼손된 경우(재화등의 내용을 확인하기 위하여 포장 등을 훼손한 경우는 제외)</li><li>소비자의 사용 또는 일부 소비로 재화등의 가치가 현저히 감소한 경우</li><li>시간이 지나 다시 판매하기 곤란할 정도로 재화등의 가치가 현저히 감소한 경우</li><li>복제가 가능한 재화등의 포장을 훼손한 경우</li><li>소비자의 주문에 따라 개별적으로 생산되는 재화등 또는 이와 유사한 재화등에 대하여 청약철회등을 인정하는 경우 통신판매업자에게 회복할 수 없는 경우</li><li>중대한 피해가 예상되는 경우로서 사전에 해당 거래에 대하여 별도로 그 사실을 고지하고 소비자의 서면(전자문서 포함)에 의한 동의를 받은 경우</li></ul></div></div></div><div class="dr-info-box"><div class="dr-info-title"><h2>기타</h2></div><div class="dr-info-desc"><h3 class="dt-hidden">기타</h3><ul><li>본 제품에 이상이 있을 경우 공정거래위원회 고시 품목별 소비자분쟁해결기준에 의해 보상해드립니다.</li><li>트러블 발생 시 인과 관계가 확인되는 (피부과 전문의의 소견서, 진료 확인서 등) 첨부하셔야 반품이 가능합니다. (발급 비용-고객 부담)</li><li>본품을 반품할 경우 사은품도 반품 처리되며 사은품을 사용한 경우 해당 사은품에 대한 비용이 발생될 수 있으며,<br />그 비용을 고객님이 부담하신 후 본품</li></ul></div></div></div>
`;

const getFilteredImagePath = (str , test) => {
    const result = str.replace(/(?=src="|srcset="|url\('|url\(").*(?=\?\$staticlink\$)/g , str => {
        const prefix = str.match(/(src\="|srcset\="|url\('|url\(")/)[0];
        const result = str.replace(/(src\="|srcset\="|url\('|url\(")/,'');
        if(test==1){
            console.log('str : ',str);
            console.log('prefix : ',prefix);
        }

        return prefix+'/images/'+result;
    });
    return result;
};

const getHTMLAsString = (path , test = 0) => {
    let result;
    try {
        result = getFilteredImagePath(fs.readFileSync(path).toString() , test)
    } catch (e) {
        console.log(e);
        result = errorString;
    }
    return result;
}

const joinHtml = (absolutePath , fileNames) => {
    let result = '';
    fileNames.map( fn => {
        result += getHTMLAsString(absolutePath + fn);
    });

    return result;
}

const getFilteredData = (prefixPath , data) => {
    const result = [];
    data.map( html => {
        result.push({
            name : html,
            link : prefixPath+html
        });
    });
    return result;
};



const defaultData = {
    customerCenterHeader : getHTMLAsString(path.join(__dirname ,'app/assets/html/common/header/customer-center-header.html')),
    footerBackToTop : getHTMLAsString(path.join(__dirname ,'app/assets/html/common/footer/Footer back to top.html')),
    footerCallCenterInfo : getHTMLAsString(path.join(__dirname ,'app/assets/html/common/footer/Footer call center info.html')),
    footerLinkRefer : getHTMLAsString(path.join(__dirname ,'app/assets/html/common/footer/Footer link refer.html')),
    footerCompanyInformation : getHTMLAsString(path.join(__dirname ,'app/assets/html/common/footer/Footer company information.html')),
    footerCopyright : getHTMLAsString(path.join(__dirname ,'app/assets/html/common/footer/Footer copyright.html'))
};

// app.set('view engine' ,'pug');
app.set('view engine' , 'ejs');
app.set('views',path.join(__dirname , 'app/views'));
app.use(express.static('app'));

app.get('/', (req , res) => {
    const result = fs.readFileSync(path.join(__dirname ,'app/assets/html/local/codingConvention.html')).toString();
    res.send(result);
});

app.get('/getPagelist', (req , res) => {
    const result = {
        pageList : [
            {
                name : '메인',
                link : '/main'
            },
            {
                name : '브랜드',
                hashParam : 'brands',
                subData : [{
                    name : '아벤느',
                    link : '/brand/avene'
                },{
                    name : '르네휘테르',
                    link : '/brand/renefurterer'
                },{
                    name : '클로란',
                    link : '/brand/klorane'
                },{
                    name : '듀크레이',
                    link : '/brand/ducray'
                },{
                    name : '아더마',
                    link : '/brand/aderma'
                }]
            },
            {
                name : '제품상세',
                hashParam : 'detail',
                subData : getFilteredData('/detail/',fs.readdirSync(__dirname + '/app/assets/html/detail/'))
            },
            {
                name : '이벤트',
                hashParam : 'events',
                subData : getFilteredData('/event/',fs.readdirSync(__dirname + '/app/assets/html/event/'))
            },
            {
                name : 'ABOUT 페이지',
                hashParam : 'about',
                subData : [{
                    name : '더모 코스메틱',
                    link : '/about/index'
                },{
                    name : '아벤느',
                    link : '/about/avene'
                },{
                    name : '르네휘테르',
                    link : '/about/renefurterer'
                },{
                    name : '클로란',
                    link : '/about/klorane'
                },{
                    name : '듀크레이',
                    link : '/about/ducray'
                },{
                    name : '아더마',
                    link : '/about/aderma'
                }]
            }
        ]
    };



    // res.send(new Promise((resolve , reject) => {
    //     resolve(() => {
    //         return result;
    //     });
    // }));
    console.log(result);
    res.send(result);
});

app.get('/main' , (req , res) => {
    const resultObj = {
        homeBannerCarrousel : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/home-banner-carrousel.html')),
        promotionMessage : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/Promotion Message.html')),
        promotionBanner : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/promotion-banner.html')),
        bsAveneDesciption : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/bs-avene-desciption.html')),
        bsAdermaDesciption : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/bs-aderma-desciption.html')),
        bsDucrayDesciption : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/bs-ducray-desciption.html')),
        bsKloraneDesciption : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/bs-klorane-desciption.html')),
        bsRenefurtererDesciption : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/bs-renefurterer-desciption.html')),
        newAndBeautyTips : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/new-and-beauty-tips.html')),
        findYourProduct : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/find-your-product.html')),
        blockThreePushes : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/block-three-pushes.html')),
        blockThreePushesYellow : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/block-three-pushes-yellow.html')),
        blockThreePushesFacebook : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/block-three-pushes-facebook.html')),
        blockThreePushes4 : getHTMLAsString(path.join(__dirname ,'app/assets/html/main/block-three-pushes-4.html'))
    };
    res.render('main_index',Object.assign({} , resultObj , defaultData));
});


app.get('/brand/:ctgrName' , (req , res) => {
    /*
        ctgrName cases :
            avene
            renefurterer
            klorane
            ducray
            aderma
    */

    const resultObj = {};

    switch(req.params.ctgrName){
        case 'avene' :
            resultObj.brandName = '아벤느';
            resultObj.homeBannerCarrousel = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/avene/brand-page-eau-thermale-avene-banner-carrousel.html'));
            resultObj.promotionMessage = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/avene/brand-page-eau-thermale-avene-promotion-message.html'));
            resultObj.promotionBanner = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/avene/brand-page-eau-thermale-avene-04.html'));
            resultObj.bsDesciption = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/avene/brand-page-eau-thermale-avene-05.html'));
            resultObj.newAndBeautyTips = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/avene/brand-page-eau-thermale-avene-07.html'));
            resultObj.findYourProduct = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/avene/brand-page-eau-thermale-avene-08.html'));
            resultObj.snsButtons = joinHtml(path.join(__dirname ,'app/assets/html/brandMain/avene/') , ['av-four-push-facebook.html' , 'av-four-push-instagram.html' , 'av-four-push-naver.html' , 'av-four-push-youtube.html']);
            break;
        case 'renefurterer' :
            resultObj.brandName = '르네휘테르';
            resultObj.homeBannerCarrousel = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/renefurterer/brand-page-eau-thermale-furterer-banner-carrousel.html'));
            resultObj.promotionMessage = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/renefurterer/brand-page-rene-promotion-message.html'));
            resultObj.promotionBanner = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/renefurterer/brand-page-rene-furterer-04.html'));
            resultObj.bsDesciption = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/renefurterer/brand-page-rene-furterer-05.html'));
            resultObj.newAndBeautyTips = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/renefurterer/brand-page-rene-furterer-07.html'));
            resultObj.findYourProduct = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/renefurterer/brand-page-rene-furterer-08.html'));
            resultObj.snsButtons = joinHtml(path.join(__dirname ,'app/assets/html/brandMain/renefurterer/') , ['rf-four-push-facebook.html' , 'rf-four-push-instagram.html' , 'rf-four-push-youtube.html']);
            break;
        case 'klorane':
            resultObj.brandName = '클로란';
            resultObj.homeBannerCarrousel = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/klorane/brand-page-eau-thermale-klorane-banner-carrousel.html'));
            resultObj.promotionMessage = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/klorane/brand-page-klorane-promotion-message.html'));
            resultObj.promotionBanner = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/klorane/brand-page-klorane-04.html'));
            resultObj.bsDesciption = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/klorane/brand-page-klorane-05.html'));
            resultObj.newAndBeautyTips = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/klorane/brand-page-klorane-07.html'));
            resultObj.findYourProduct = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/klorane/brand-page-klorane-08.html'));
            resultObj.snsButtons = joinHtml(path.join(__dirname ,'app/assets/html/brandMain/klorane/') , ['kl-block-four-push-facebook.html' , 'kl-block-four-push-instagram.html' , 'kl-block-four-push-naver-post.html','kl-block-four-push-youtube.html']);
            break;
        case 'ducray':
            resultObj.brandName = '듀크레이';
            resultObj.homeBannerCarrousel = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/ducray/brand-page-eau-thermale-ducray-banner-carrousel.html'));
            resultObj.promotionMessage = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/ducray/brand-page-ducray-promotion-message.html'));
            resultObj.promotionBanner = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/ducray/brand-page-ducray-04.html'));
            resultObj.bsDesciption = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/ducray/brand-page-ducray-05.html'));
            resultObj.newAndBeautyTips = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/ducray/brand-page-ducray-07.html'));
            resultObj.findYourProduct = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/ducray/brand-page-ducray-08.html'));
            resultObj.snsButtons = joinHtml(path.join(__dirname ,'app/assets/html/brandMain/ducray/') , ['du-four-push-facebook.html' , 'du-four-push-youtube.html']);
            break;
        case 'aderma':
            resultObj.brandName = '아더마';
            resultObj.homeBannerCarrousel = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/aderma/brand-page-eau-thermale-aderma-banner-carrousel.html'));
            resultObj.promotionMessage = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/aderma/brand-page-a-derma-promotion-message.html'));
            resultObj.promotionBanner = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/aderma/brand-page-a-derma-04.html'));
            resultObj.bsDesciption = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/aderma/brand-page-a-derma-05.html'));
            resultObj.newAndBeautyTips = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/aderma/brand-page-a-derma-07.html'));
            resultObj.findYourProduct = getHTMLAsString(path.join(__dirname ,'app/assets/html/brandMain/aderma/brand-page-a-derma-08.html'));
            break;
        default :
            break;
    }

    res.render('brand_index',Object.assign({} , resultObj , defaultData));
});


app.get('/event/:eventId' , (req , res) => {
    const eventId = req.params.eventId.replace(/\.html/,'');
    let resultObj = {
        eventData : errorString,
        eventName : ''
    };

    try {
        resultObj.eventData = getHTMLAsString(path.join(__dirname ,'app/assets/html/event/'+eventId+'.html'));
        resultObj.eventName = eventId;
    } catch (e) {
        console.log('HTML 을 찾을 수가 없습니다.');
    }

    res.render('event_index',Object.assign({} , resultObj , defaultData));
});



app.get('/detail/:productId' , (req , res) => {
    const productId = req.params.productId.replace(/\.html/,'');
    let resultObj = {
        detailData : '',
        detailDeliveryData : '',
        prodName : ''
    };

    try {
        resultObj.detailData = getHTMLAsString(path.join(__dirname ,'app/assets/html/detail/'+productId+'.html'));
        resultObj.prodName = productId;
    } catch (e) {
        resultObj.detailData = false;
        // console.log(e);
    }

    try {
        resultObj.detailDeliveryData = getHTMLAsString(path.join(__dirname ,'app/assets/html/detail/'+productId+'-delivery.html'));
    } catch (e) {
        resultObj.detailDeliveryData = false;
        // console.log(e);
    }

    if(!resultObj.detailDeliveryData ){
        resultObj.detailDeliveryData = deliveryString;
        // resultObj.detailDeliveryData = errorString;
    }

    if(!resultObj.detailData){
        resultObj.detailData = errorString;
    }

    res.render('detail_index',Object.assign({} , resultObj , defaultData));
});

app.get('/about/:brandName' , (req,res) => {
    const brandName = req.params.brandName == 'index' ? 'dermo-cosmetics' : req.params.brandName;
    const resultObj = {
        aboutData : getHTMLAsString(path.join(__dirname ,'app/assets/html/about/about-'+brandName+'.html'))
    };

    res.render('about_index',Object.assign({} , resultObj , defaultData));
});

app.listen(PORT , () => {
    console.log('Server running on '+PORT+' port');
})
