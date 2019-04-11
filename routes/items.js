const express = require("express");
const axios = require("axios");
const router = express.Router();

const api = axios.create({
  baseURL: "https://api.mercadolibre.com"
});

const fetchItem = async itemId => {
  return axios.all([
    api.get(`/items${itemId}`),
    api.get(`/items${itemId}/description`)
  ]);
};

const fetchItems = async query => {
  return axios.all([api.get(query), api.get(`/currencies`)]);
};

const fetchCategories = async categoryId => {
  return api.get(`/categories/${categoryId}`);
};

const fetchCurrencies = async currencyId => {
  return api.get(`/currencies/ARS`);
};

/* GET items list. */
router.get("/", async (req, res, next) => {
  var query_items = "/sites/MLA/search?";
  query_items += req.query.q ? `q=${req.query.q}` : "";
  query_items += req.query.limit ? `&limit=${req.query.limit}` : "";

  const [items, currencies] = await fetchItems(query_items);
  const categories = await fetchCategories(items.data.results[0].category_id);
  const itemsList = [];

  items.data.results.map(i => {
    const currency = currencies.data.find(c => {
      return (c.id = i.currency_id);
    });

    const new_item = {
      id: i.id,
      title: i.title,
      price: {
        currency: currency.symbol,
        amount: i.price,
        decimals: currency.decimal_places
      },
      picture: i.thumbnail,
      condition: i.condition,
      free_shipping: i.shipping.free_shipping
    };
    itemsList.push(new_item);
  });

  res.send({
    author: {
      name: "Martin",
      lastname: "Urrutia"
    },
    categories: categories.data.path_from_root,
    items: itemsList
  });
});

/* GET item detail. */
router.get("/:id", async (req, res) => {
  const [item, description] = await fetchItem(req.path);
  const currency = await fetchCurrencies(item.currency_id);
  const categories = await fetchCategories(item.data.category_id);

  res.send({
    author: {
      name: "Martin",
      lastname: "Urrutia"
    },
    categories: categories.data.path_from_root,
    item: {
      id: item.data.id,
      title: item.data.title,
      price: {
        currency: currency.data.symbol,
        amount: item.data.price,
        decimals: currency.data.decimal_places
      },
      picture: item.data.pictures[0].url,
      condition: item.data.condition,
      free_shipping: item.data.shipping.free_shipping,
      sold_quantity: item.data.sold_quantity,
      description: description.data.plain_text
    }
  });
});

module.exports = router;
