import config from '../config';
import { generatePriceHash, generateProductHash } from '../db/helpers';
import { Price, Product } from '../db/types';
import { upsertProducts } from '../db/upsert';

type ScalewayComputeInstance = {
  name: string;
  price: string;
};

type ScalewayAppleSilicon = {
  name: string;
  price: string;
};

type ScalewayLoadBalancer = {
  name: string;
  price: string;
};

type ScalewayRegion = {
  compute: {
    instance: ScalewayComputeInstance[];
    appleSilicon: ScalewayAppleSilicon[];
    flexibleIp: {
      price: string;
    };
  };
  network: {
    loadBalancer: ScalewayLoadBalancer[];
  };
};

const regions: { [key: string]: ScalewayRegion } = {
  'fr-par-1': {
    compute: {
      instance: [
        {
          name: 'GP1-XS',
          price: '0.082',
        },
        {
          name: 'GP1-S',
          price: '0.168',
        },
        {
          name: 'GP1-M',
          price: '0.338',
        },
        {
          name: 'GP1-L',
          price: '0.658',
        },
        {
          name: 'GP1-XL',
          price: '1.398',
        },
        {
          name: 'DEV1-S',
          price: '0.008',
        },
        {
          name: 'DEV1-M',
          price: '0.018',
        },
        {
          name: 'DEV1-L',
          price: '0.038',
        },
        {
          name: 'DEV1-XL',
          price: '0.058',
        },
      ],
      appleSilicon: [
        {
          name: 'M1-M',
          price: '0.10',
        },
      ],
      flexibleIp: {
        price: '0.002',
      },
    },
    network: {
      loadBalancer: [
        {
          name: 'LB-S',
          price: '0.014',
        },
      ],
    },
  },
};

async function scrape() {
  for (const region in regions) {
    config.logger.info(`Processing region ${region}`);

    const data = regions[region];

    const products: Product[] = [
      ...data.compute.instance.map(mapComputeInstance(region)),
      mapFlexibleIp(region, data.compute.flexibleIp.price),
    ];

    await upsertProducts(products);
  }
}

function mapComputeInstance(
  region: string
): (value: ScalewayComputeInstance) => Product {
  return (value: ScalewayComputeInstance) => {
    config.logger.info(`Adding compute instance ${value.name} for ${region}`);

    const product: Product = {
      productHash: '',
      vendorName: 'scaleway',
      service: 'Instance',
      productFamily: 'Compute',
      region: region,
      sku: `generated-${value.name}`,
      attributes: {
        type: value.name,
      },
      prices: [],
    };

    product.productHash = generateProductHash(product);

    const price: Price = {
      priceHash: '',
      purchaseOption: 'standard',
      unit: 'hours',
      effectiveDateStart: Date.now().toString(),
      EUR: value.price,
    };

    price.priceHash = generatePriceHash(product, price);

    product.prices = [price];

    console.log(product);

    return product;
  };
}

function mapFlexibleIp(region: string, value: string): Product {
  config.logger.info(`Adding compute flexible ip for ${region}`);

  const product: Product = {
    productHash: '',
    vendorName: 'scaleway',
    service: 'Flexible IP',
    productFamily: 'Compute',
    region: region,
    sku: `generated-compute-flexible-ip`,
    attributes: {},
    prices: [],
  };

  product.productHash = generateProductHash(product);

  const price: Price = {
    priceHash: '',
    purchaseOption: 'standard',
    unit: 'hours',
    effectiveDateStart: Date.now().toString(),
    EUR: value,
  };

  price.priceHash = generatePriceHash(product, price);

  product.prices = [price];

  console.log(product);

  return product;
}

export default {
  scrape,
};
