const cdk = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const iam = require('aws-cdk-lib/aws-iam');

class S3SPAStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const spaBucket = new s3.Bucket(this, 'nodejs-aws-shop-react', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true
    });

    const oai = new cloudfront.OriginAccessIdentity(this, 'MyOAI');
    
    const distribution = new cloudfront.Distribution(this, 'StaticSiteDisctribution', {
      defaultBehavior: { origin: new origins.S3Origin(spaBucket, {
        originAccessIdentity: oai
      }), viewerProtocolPolicy: 'redirect-to-https'},
      priceClass: 'PriceClass_100',
      defaultRootObject: 'index.html',
    });

    spaBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [spaBucket.arnForObjects('*')],
      effect: 'Allow',
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        "StringEquals": {
          'aws:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`
        }
      }
    }))

    spaBucket.grantRead(oai)


    new s3deploy.BucketDeployment(this, 'StaticSiteFiles', {
      sources: [s3deploy.Source.asset('../dist')],
      destinationBucket: spaBucket,
      distribution: distribution,
      distributionPaths: ['/*'],
    });
  }
}

module.exports = { S3SPAStack }
