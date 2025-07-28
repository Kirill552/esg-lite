Yoo.Checkout API SDK (неофициальный)
A@СЕМЬ версия npm лицензия версия npm README на русском языке!

Yoo.Checkout — универсальное решение для работы с онлайн-платежами. Yoo.Checkout API построен на принципах REST, работает с реальными объектами и имеет предсказуемое поведение. С помощью этого API вы можете отправлять запросы на оплату, сохранять платежную информацию для повторных списаний (и включать автоплатежи), осуществлять возврат средств и многое другое. В качестве основного протокола API использует HTTP, что означает, что он подходит для разработки на любом языке программирования, который может работать с HTTP-библиотеками (например, cURL). Для аутентификации используется Basic Auth, поэтому вы можете отправить первый запрос прямо из браузера. API поддерживает запросы POST и GET. В запросах POST используются аргументы JSON, а в запросах GET — строки запроса. API всегда возвращает ответ в формате JSON, независимо от типа запроса.

Аутентификация
Для аутентификации запросов необходимо использовать HTTP Basic Auth. В заголовках запросов в качестве имени пользователя нужно указать идентификатор вашего магазина в YooKassa, а в качестве пароля — ваш секретный ключ (он должен быть сгенерирован и активирован с помощью пароля из смс)

Пример запроса с аутентификацией

curl https://api.yookassa.ru/v3/payments/{payment_id} \
 -u <shopId>:<secretKey>
Идемпотентность
В контексте API идемпотентность означает, что несколько запросов обрабатываются так же, как и один запрос. Это значит, что если вы получите повторный запрос с теми же параметрами, то в ответ получите результат исходного запроса. Такое поведение помогает избежать нежелательного повторения транзакций. Например, если при совершении платежа возникла проблема с сетью и соединение прервалось, вы можете безопасно повторять запрос столько раз, сколько захотите. Запросы GET по умолчанию идемпотентны, поскольку не влекут за собой нежелательных последствий. Заголовок Idempotence-Key (или ключ идемпотентности) используется для обеспечения идемпотентности запросов POST.

Пример запроса с идемпотентным ключом

curl https://api.yookassa.ru/v3/refunds \
 -X POST \
 -u <shopId>:<secretKey> \
 -H 'Idempotence-Key: <ключ идемпотентности>' \
 -H 'Content-Type: application/json' \
 -d '{
 "сумма": {
 "значение": "2,00",
 "валюта": "руб."
 },
 "идентификатор платежа": "215d8da0-000f-50be-b000-0003308c89be"
 }'
Если вы повторяете запрос с теми же данными и тем же ключом, API обрабатывает его как повторный запрос. Если данные в запросе те же, а ключ идемпотентности отличается, запрос выполняется как новый. Вы можете передать любое значение, уникальное для этой операции, в заголовке Idempotence-Key. Мы рекомендуем использовать UUID версии 4. YooKassa обеспечивает идемпотентность в течение 24 часов после первого запроса, после чего второй запрос будет обработан как новый.

Синхронность
YooKassa немедленно обрабатывает полученный запрос и возвращает результат обработки («успешно» или «неуспешно»). Если точный ответ не может быть получен в течение 30 секунд, например из-за проблемы на стороне эквайера, YooKassa вернет HTTP-код 500 и попытается отменить операцию. Чтобы узнать окончательный результат запроса, повторите его с теми же данными и тем же идемпотентным ключом. Рекомендуемая частота повторений — раз в минуту, пока YooKassa не выдаст ответ, отличный от HTTP 500.

Коды ответов HTTP
Если запрос будет успешно обработан, API вернёт HTTP-код 200 и тело ответа. Если во время обработки возникнет ошибка, API вернёт объект с ошибкой и стандартный HTTP-код.

HTTP - КОД	КОД ОШИБКИ	Описание
400	invalid_request, not_supported	Неверный запрос. Чаще всего этот статус возникает из-за нарушения правил взаимодействия с API.
401	invalid_credentials	[Базовая аутентификация] Идентификатор вашей учётной записи YooKassa или секретный ключ (имя пользователя и пароль для аутентификации) недействительны. [OAuth 2.0] Недействительный токен OAuth: он недействителен, устарел или был отозван. Запросите токен повторно.
403	запрещено	Секретный ключ или токен OAuth указаны верно, но у вас нет прав для завершения транзакции.
404	не_ найден	Ресурс не найден.
429	слишком много_запросов	Превышен лимит запросов за единицу времени. Попробуйте снизить интенсивность запросов.
500	internal_server_error ( ошибка внутреннего сервера )	Технические проблемы на стороне YooKasa. Результат обработки запроса неизвестен. Повторите запрос позже, используя тот же ключ идемпотентности. Рекомендуется повторять запрос с интервалом в одну минуту, пока YooKassa не сообщит о результате обработки операции.
Пример тела ответа на ошибку

  "тип"
    {: "ошибка",
    "идентификатор": "ab5a11cd-13cc-4e33-af8b-75a74e18dd09",
    "код": "invalid_request",
    "описание": "Дублирован ключ идемпотенции",
    "параметр": "Ключ идемпотенции"
  }
Ответ на ошибку SDK

"тип" {
    ErrorResponse: "ошибка",
    "идентификатор": "ab5a11cd-13cc-4e33-af8b-75a74e18dd09",
    "код": "invalid_request",
    "описание": "Дублирован ключ идемпотенции",
    "параметр": "Ключ идемпотенции"
    "Код ошибки":  401 
}
Ссылка
Страница YooKassa API

Установка
npm установить @a2seven/yoo-checkout
Приступая к работе
shopId { ( YooCheckout new =checkout const

// ИЛИ const { YooCheckout } = require('@a2seven/yoo-checkout'); ; '@a2seven/yoo-checkout' from }YooCheckout{ import: 'your_shopId', secretKey: 'your_secretKey' });
Документы
Создать платеж
shopId { (YooCheckout new  = оформить заказ const;

'@a2seven/yoo-оформить заказ' из } ICreatePayment ,YooCheckout{ import: 'your_shopId', SecretKey: 'your_secretKey' });

const idempotenceKey =  '02347fc4-a1f0-49db-807e-f0d67c2ed5a5';

const createPayload: ICreatePayment = {
    сумма: {
        значение: '2.00',
        валюта: 'RUB'
    },
    payment_method_data: {
        тип: 'банковская карта'
    },
     подтверждение: {
        введите: 'redirect',
        return_url: 'test'
    }
};

попробуйте {
    const payment = ожидайте оформления заказа.createPayment(createPayload, idempotenceKey);
    консоль.журнал(платеж)
} перехват (ошибка ) {
     консоль.ошибка(error);
}
Получить оплату
shopId { ( YooCheckout new =оформить заказ

const ; '@a2seven/yoo-оформить заказ' из }YooCheckout{ импорт: 'your_shopId', секретный ключ: 'your_secretKey' });

const PaymentID = '21966b95-000f- 50bf-b000-0d78983bb5bc';

try {
    const payment = await checkout.getPayment(PaymentID);
    console.log(платеж)
} catch (ошибка) {
     console.error(ошибка);
}
Захват платежа
shopId { (YooCheckout new = оформить 

     import:  SecretKey:  

    '21966b95-000f-50bf-b000-0d78983bb5bc';

const idempotenceKey = '02347fc4-a1f0-49db-807e-f0d67c2ed5a5';

const capturePayload: ICapturePayment = {
    сумма: {
        значение: '2.00',
         валюта: 'RUB'
    }
}}

try {
    const payment = ожидание оформления заказа.capturePayment(PaymentID, capturePayload, idempotenceKey);
    консоль.журнал(платеж)
} перехват (ошибка) {
     консоль.ошибка(ошибка);
}
Отменить платеж
shopId { ( YooCheckout new =оформить заказ

const ; '@a2seven/yoo-оформить заказ' из }YooCheckout{ импорт: 'your_shopId', секретный ключ: 'your_secretKey' });

const PaymentID = '21966b95-000f- 50bf-b000-0d78983bb5bc';

const idempotenceKey = '02347fc4-a1f0-49db-807e-f0d67c2ed5a5';

try {
    const оплата = ожидание оформления заказа.Отмена платежа(PaymentID, idempotenceKey); 
    консоль.журнал(оплаты)
} перехват (ошибка) {
     консоль.ошибка(error);
}
Получить список платежей
shopId { (YooCheckout new = оформить заказ const;

'@a2seven/yoo-оформить заказ' из } IGetPaymentList ,YooCheckout{ импорт: 'your_shopId', секретный ключ: 'your_secretKey' });

постоянные фильтры:  IGetPaymentList = { created_at: { значение: '2021-01-27T13:58:02.977Z', режим: 'gte' },  лимит: 20 };

try {
    const paymentList = ожидание оформления заказа.getPaymentList(фильтры);
    консоль .журнал(список платежей)
} перехват (ошибка) {
     консоль.ошибка(error);
}
Создать возврат средств
shopId { (YooCheckout new = оформить заказ const;

'@a2seven/yoo-оформить заказ' из } ICreateRefund ,YooCheckout{ import: 'your_shopId', SecretKey: 'your_secretKey' });

const idempotenceKey =  '02347fc4-a1f0-49db-807e-f0d67c2ed5a5';

const createRefundPayload: ICreateRefund = {
    payment_id: '27a3852a-000f-5000-8000- 102d922df8db',
    сумма: {
        значение: '1.00',
        валюта: 'RUB'
    }
};

попробуйте {
    const refund = ожидайте оформления заказа.createRefund(createRefundPayload, idempotenceKey);
    консоль.журнал(возврат )
} catch (ошибка) {
     консоль.ошибка(ошибка);
}
Получить возмещение
shopId { ( YooCheckout new =оформить заказ

const ; '@a2seven/yoo-оформить заказ' из }YooCheckout{ импорт: 'your_shopId', секретный ключ: 'your_secretKey' });

const refundId = '21966b95-000f- 50bf-b000-0d78983bb5bc';

try {
    const refund = ожидание оформления заказа.getRefund(refundId);
    console.log(возврат)
} catch (ошибка) {
     console.error(ошибка);
}
Получить список возвратов
shopId { (YooCheckout new = оформить заказ const;

'@a2seven/yoo-оформить заказ' из } IGetRefundList ,YooCheckout{ import: 'your_shopId', SecretKey: 'your_secretKey' });

const фильтры:  IGetRefundList = { created_at: { значение: '2021-01-27T13:58:02.977Z', режим: 'gte' },  ограничение: 20 };

try {
    const refundList = ожидание оформления заказа.getRefundList(фильтры);
    консоль .log(refundList)
} catch (ошибка) {
     консоль.ошибка(error);
}
Создать квитанцию
import { YooCheckout, ICreateReceipt } from '@a2seven/yoo-checkout';

const checkout = new YooCheckout({ shopId: 'your_shopId', secretKey: 'your_secretKey' });

const idempotenceKey = '02347fc4-a1f0-49db-807e-f0d67c2ed5a5';

const createReceiptPayload: ICreateReceipt = {
    send: true,
    customer: {
        email: 'test@gmail.com'
    },
    settlements: [
        {
            type: 'cashless',
            amount: {
                value: '2.00',
                currency: 'RUB'
            }
        }
    ],
    refund_id: '27a387af-0015-5000-8000-137da144ce29',
    type: 'refund',
    items: [
        {
            description: 'test',
            quantity: '2',
            amount: {
                value: '1.00',
                currency: 'RUB'
            },
            vat_code: 1,
        }
    ]
};

try {
    const receipt = await checkout.createReceipt(createReceiptPayload, idempotenceKey);
    console.log(receipt)
} catch (error) {
     console.error(error);
}
Get receipt
import { YooCheckout } from '@a2seven/yoo-checkout';

const checkout = new YooCheckout({ shopId: 'your_shopId', secretKey: 'your_secretKey' });

const receiptId = '21966b95-000f-50bf-b000-0d78983bb5bc';

try {
    const receipt = await checkout.getReceipt(receiptId);
    console.log(receipt)
} catch (error) {
     console.error(error);
}
Get receipt list
import { YooCheckout, IGetReceiptList } from '@a2seven/yoo-checkout';

const checkout = new YooCheckout({ shopId: 'your_shopId', secretKey: 'your_secretKey' });

const filters: IGetReceiptList = { created_at: { value: '2021-01-27T13:58:02.977Z', mode: 'gte' },  limit: 20 };

try {
    const receiptList = await checkout.getReceiptList(filters);
    console.log(receiptList)
} catch (error) {
     console.error(error);
}
The following functionality works only as part of an affiliate program
Create webhook
import { YooCheckout, ICreateWebHook } from '@a2seven/yoo-checkout';

const checkout = new YooCheckout({ shopId: 'your_shopId', secretKey: 'your_secretKey', token: 'your_OAuth_token' });

const idempotenceKey = '02347fc4-a1f0-49db-807e-f0d67c2ed5a5';
const createWebHookPayload: ICreateWebHook = {
    event: 'payment.canceled',
    url: 'https://test.com/hook'
};

try {
    const webhook = await checkout.createWebHook(createWebHookPayload, idempotenceKey);
    console.log(webhook)
} catch (error) {
     console.error(error);
}
Get webhook list
import { YooCheckout } from '@a2seven/yoo-checkout';

const checkout = new YooCheckout({ shopId: 'your_shopId', secretKey: 'your_secretKey', token: 'your_OAuth_token' });
try {
    const webHookList = await checkout.getWebHookList();
    console.log(webHookList)
} catch (error) {
     console.error(error);
}
Delete webhook
import { YooCheckout, ICreateWebHook } from '@a2seven/yoo-checkout';

const checkout = new YooCheckout({ shopId: 'your_shopId', secretKey: 'your_secretKey', token: 'your_OAuth_token' });

const webHookId = 'wh-edba6d49-ce3e-4d99-991b-4bb164859dc3';

try {
    await checkout.deleteWebHook(webHookId);
} catch (error) {
     console.error(error);
}
Get shop info
import { YooCheckout, ICreateWebHook } from '@a2seven/yoo-checkout';

const checkout = new YooCheckout({ shopId: 'your_shopId', secretKey: 'your_secretKey', token: 'your_OAuth_token' });

try {
   const shop = await checkout.getShop();
   console.log(shop)
} catch (error) {
     console.error(error);
}
Running Tests
To install the development dependencies (run where the package.json is):

$ npm install
Run the tests:

$ npm run test:unit